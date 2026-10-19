import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function workspaceContext(tenantId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: memberships, error: memberError } = await supabase
    .from("sweep_memberships")
    .select("tenant_id,role,sweep_tenants(name)")
    .eq("user_id", user.id)
    .eq("is_active", true);
  if (memberError) throw new Error("Unable to load your organization access.");
  const membership = tenantId
    ? memberships?.find((m) => m.tenant_id === tenantId)
    : memberships?.[0];
  return { supabase, user, memberships: memberships ?? [], membership };
}

export function requireRole(role: string | undefined, allowed: string[]) {
  if (!role || !allowed.includes(role))
    throw new Error("Your role cannot perform this action.");
}

export function tenantName(value: unknown): string {
  const item = Array.isArray(value) ? value[0] : value;
  return item && typeof item === "object" && "name" in item
    ? String(item.name)
    : "Your organization";
}
