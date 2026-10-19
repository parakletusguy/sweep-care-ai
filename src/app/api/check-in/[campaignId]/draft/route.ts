import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { scoringRulesSchema } from "../../check-in-guards";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await params;
  const parsed = z
    .object({ responses: z.record(z.number().int()) })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!z.string().uuid().safeParse(campaignId).success || !parsed.success)
    return NextResponse.json({ error: "Invalid draft." }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: campaign, error: campaignError } = await supabase
    .from("sweep_campaigns")
    .select("tenant_id,assessment_version_id,status,closes_at")
    .eq("id", campaignId)
    .maybeSingle();
  if (
    campaignError ||
    !campaign ||
    campaign.status !== "ACTIVE" ||
    new Date(campaign.closes_at) <= new Date()
  )
    return NextResponse.json(
      { error: "Campaign unavailable." },
      { status: 403 },
    );
  const { data: version } = await supabase
    .from("sweep_assessment_versions")
    .select("scoring_rules")
    .eq("id", campaign.assessment_version_id)
    .maybeSingle();
  const rules = scoringRulesSchema.safeParse(version?.scoring_rules);
  if (
    !rules.success ||
    Object.entries(parsed.data.responses).some(([id, value]) => {
      const rule = rules.data.find((r) => r.questionId === id);
      return (
        !rule ||
        value < (rule.minScaleVal ?? 1) ||
        value > (rule.maxScaleVal ?? 5)
      );
    })
  )
    return NextResponse.json({ error: "Invalid answers." }, { status: 400 });
  const { error } = await supabase
    .from("sweep_assessment_drafts")
    .upsert({
      tenant_id: campaign.tenant_id,
      campaign_id: campaignId,
      participant_id: user.id,
      responses: parsed.data.responses,
      updated_at: new Date().toISOString(),
    });
  return error
    ? NextResponse.json(
        { error: "Consent is required to save drafts." },
        { status: 403 },
      )
    : NextResponse.json({ saved: true });
}
