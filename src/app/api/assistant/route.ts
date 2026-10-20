import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { navigateResources } from "@/domain/ai-assistant/resource-navigation";

export async function POST(request: Request) {
  const body = z
    .object({
      tenantId: z.string().uuid(),
      message: z.string().trim().min(2).max(2000),
      locale: z.enum(["en", "fr", "es"]).default("en"),
      previousTopic: z.string().trim().max(2000).optional(),
    })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: "Enter a topic and valid organization." },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: membership, error: memberError } = await supabase
    .from("sweep_memberships")
    .select("role")
    .eq("tenant_id", body.data.tenantId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (memberError || membership?.role !== "PARTICIPANT")
    return NextResponse.json(
      { error: "Participant access required." },
      { status: 403 },
    );
  const { data: resources, error } = await supabase
    .from("sweep_knowledge_resources")
    .select("id,title,url,excerpt,tags,approved_at")
    .eq("tenant_id", body.data.tenantId);
  if (error)
    return NextResponse.json(
      { error: "Approved resources are unavailable." },
      { status: 503 },
    );
  const reply = navigateResources(body.data.message, resources ?? [], {
    locale: body.data.locale,
    previousTopic: body.data.previousTopic,
  });
  const { error: auditError } = await supabase
    .from("sweep_assistant_events")
    .insert({
      tenant_id: body.data.tenantId,
      user_id: user.id,
      mode: reply.mode,
      source_ids: reply.resources.map((r) => r.id),
      output_hash: createHash("sha256")
        .update(JSON.stringify(reply))
        .digest("hex"),
      model_version: reply.modelVersion,
      prompt_version: reply.promptVersion,
    });
  if (auditError)
    return NextResponse.json(
      { error: "Unable to record this assistant response." },
      { status: 503 },
    );
  return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
}
