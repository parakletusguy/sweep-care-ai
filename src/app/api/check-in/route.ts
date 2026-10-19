import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkInRequestSchema } from "./check-in-guards";

export async function POST(request: Request) {
  const body = checkInRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!body.success)
    return NextResponse.json(
      { error: "Check-in details are incomplete or invalid." },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json(
      { error: "Sign in is required to submit a check-in." },
      { status: 401 },
    );
  const { data, error } = await supabase.rpc("sweep_submit_checkin", {
    p_campaign: body.data.campaignId,
    p_responses: body.data.responses,
  });
  if (error) {
    const status =
      error.code === "42501" ? 403 : error.code === "23505" ? 409 : 400;
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "You have already submitted this check-in."
            : "Unable to submit. Check your consent, adult participant setup, answers and campaign availability.",
      },
      { status },
    );
  }
  return NextResponse.json({ success: true, ...data });
}
