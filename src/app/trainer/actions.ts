"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { workspaceContext } from "@/lib/workspace";
export async function sessionCommand(form: FormData) {
  const tenant = z.string().uuid().parse(form.get("tenantId"));
  const command = z
    .enum(["CREATE", "APPROVE", "ENROLL", "ATTENDANCE", "COMPLETE"])
    .parse(form.get("command"));
  const { supabase } = await workspaceContext(tenant);
  const payload: Record<string, unknown> = {};
  if (command === "CREATE") {
    payload.title = z.string().trim().min(2).max(200).parse(form.get("title"));
    payload.materials = z.string().max(12000).parse(form.get("materials"));
    payload.facilitatorId = z.string().uuid().parse(form.get("facilitatorId"));
    payload.scheduledAt = new Date(
      String(form.get("scheduledAt")),
    ).toISOString();
  } else {
    payload.sessionId = z.string().uuid().parse(form.get("sessionId"));
    if (command === "ENROLL" || command === "ATTENDANCE")
      payload.participantId = z
        .string()
        .uuid()
        .parse(form.get("participantId"));
    if (command === "ATTENDANCE")
      payload.attended = form.get("attended") === "true";
  }
  const { error } = await supabase.rpc("sweep_session_command", {
    p_tenant: tenant,
    p_command: command,
    p_data: payload,
  });
  if (error)
    throw new Error(
      "Unable to update this session. Check your role and the session’s approval state.",
    );
  revalidatePath("/trainer");
}
