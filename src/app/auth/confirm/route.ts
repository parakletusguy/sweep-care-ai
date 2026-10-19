import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Email token hashes work across devices; they do not depend on the
 * administrator's PKCE verifier when an invitation email is requested. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (!token || type !== "email")
    return NextResponse.redirect(
      new URL("/login?error=link-expired", url.origin),
    );
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "email",
  });
  if (error)
    return NextResponse.redirect(
      new URL("/login?error=link-expired", url.origin),
    );
  const { error: inviteError } = await supabase.rpc("sweep_accept_invitations");
  if (inviteError)
    return NextResponse.redirect(
      new URL("/login?error=invitation-failed", url.origin),
    );
  const { data: memberships, error: memberError } = await supabase
    .from("sweep_memberships")
    .select("id")
    .eq("is_active", true)
    .limit(1);
  if (memberError)
    return NextResponse.redirect(
      new URL("/login?error=access-unavailable", url.origin),
    );
  const response = NextResponse.redirect(
    new URL(memberships?.length ? "/dashboard" : "/onboarding", url.origin),
  );
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
