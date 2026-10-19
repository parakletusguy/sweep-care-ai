"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { workspaceContext, requireRole } from "@/lib/workspace";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveProfile(form: FormData) {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2).max(120),
      locale: z.enum(["en", "fr", "es"]),
    })
    .parse(Object.fromEntries(form));
  const { supabase, user } = await workspaceContext();
  const { error } = await supabase.from("sweep_profiles").upsert({
    id: user.id,
    full_name: parsed.fullName,
    locale: parsed.locale,
    adult_confirmed: form.get("adult") === "on",
  });
  if (error) throw new Error("Unable to save your profile.");
  (await cookies()).set("sweep-locale", parsed.locale, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 31536000,
  });
  revalidatePath("/dashboard");
}

export async function saveConsent(form: FormData) {
  const tenantId = z.string().uuid().parse(form.get("tenantId"));
  const { supabase, user, membership } = await workspaceContext(tenantId);
  requireRole(membership?.role, ["PARTICIPANT"]);
  const { error } = await supabase.from("sweep_consents").insert({
    tenant_id: tenantId,
    participant_id: user.id,
    category: "CORE_ASSESSMENT",
    granted: form.get("granted") === "true",
    policy_version: "core-assessment-2026-10-19",
  });
  if (error) throw new Error("Unable to record your consent decision.");
  revalidatePath("/dashboard");
}

export async function inviteMember(form: FormData) {
  const parsed = z
    .object({
      tenantId: z.string().uuid(),
      email: z.string().email().max(254),
      role: z.enum([
        "ORG_ADMIN",
        "PARTICIPANT",
        "WELLBEING_PROFESSIONAL",
        "SAFEGUARDING_OFFICER",
        "HR_MANAGER",
        "TRAINER_FACILITATOR",
      ]),
    })
    .parse(Object.fromEntries(form));
  const { supabase, membership } = await workspaceContext(parsed.tenantId);
  requireRole(membership?.role, ["ORG_ADMIN"]);
  const { error } = await supabase.rpc("sweep_invite", {
    p_tenant: parsed.tenantId,
    p_email: parsed.email,
    p_role: parsed.role,
  });
  if (error) throw new Error("Unable to create the invitation.");
  // Auth sends the actual one-time sign-in email through the configured SMTP
  // provider. The verified email, not user metadata, accepts the invitation.
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://careai.sweepacademy.org";
  const { error: mailError } = await supabase.auth.signInWithOtp({
    email: parsed.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  revalidatePath("/admin");
  redirect(
    `/admin?tenant=${parsed.tenantId}&notice=${mailError ? "invitation-email-failed" : "invitation-email-accepted"}`,
  );
}

export async function changeMember(form: FormData) {
  const parsed = z
    .object({
      tenantId: z.string().uuid(),
      userId: z.string().uuid(),
      role: z.enum([
        "ORG_ADMIN",
        "PARTICIPANT",
        "WELLBEING_PROFESSIONAL",
        "SAFEGUARDING_OFFICER",
        "HR_MANAGER",
        "TRAINER_FACILITATOR",
      ]),
    })
    .parse(Object.fromEntries(form));
  const { supabase, membership } = await workspaceContext(parsed.tenantId);
  requireRole(membership?.role, ["ORG_ADMIN"]);
  const { error } = await supabase.rpc("sweep_manage_member", {
    p_tenant: parsed.tenantId,
    p_user: parsed.userId,
    p_role: parsed.role,
    p_active: form.get("active") === "on",
  });
  if (error)
    throw new Error(
      "Unable to update this member. The last active administrator must remain.",
    );
  revalidatePath("/admin");
}

const question = z
  .object({
    label: z.string().trim().min(2).max(500),
    domain: z.string().trim().min(1).max(80),
    min: z.number().int().min(1).max(9),
    max: z.number().int().min(2).max(10),
    reverse: z.boolean().default(false),
  })
  .refine((q) => q.min < q.max);
export async function publishCheckIn(form: FormData) {
  const parsed = z
    .object({
      tenantId: z.string().uuid(),
      title: z.string().trim().min(2).max(160),
      description: z.string().trim().max(2000),
      closes: z.string().datetime(),
      questions: z.array(question).min(1).max(50),
    })
    .parse({
      tenantId: form.get("tenantId"),
      title: form.get("title"),
      description: form.get("description"),
      closes: new Date(String(form.get("closes"))).toISOString(),
      questions: JSON.parse(String(form.get("questions"))),
    });
  const { supabase, membership } = await workspaceContext(parsed.tenantId);
  requireRole(membership?.role, ["ORG_ADMIN", "WELLBEING_PROFESSIONAL"]);
  const questions = parsed.questions.map((q, index) => ({
    id: `q${index + 1}`,
    label: q.label,
    domain: q.domain,
    min: q.min,
    max: q.max,
  }));
  const rules = parsed.questions.map((q, index) => ({
    questionId: `q${index + 1}`,
    domainId: q.domain,
    minScaleVal: q.min,
    maxScaleVal: q.max,
    reverseScore: q.reverse,
  }));
  const { error } = await supabase.rpc("sweep_publish_checkin", {
    p_tenant: parsed.tenantId,
    p_title: parsed.title,
    p_description: parsed.description,
    p_questions: questions,
    p_rules: rules,
    p_closes: parsed.closes,
  });
  if (error) throw new Error("Unable to publish this check-in.");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
