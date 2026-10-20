import { serverLocale } from "@/lib/server-locale";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceContext } from "@/lib/workspace";
import { CheckInForm } from "./check-in-form";
import { parseLocale } from "@/lib/locale";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { locale, t } = await serverLocale();
  const { campaignId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(campaignId)) notFound();
  const { supabase, user } = await workspaceContext();
  const { data: campaign, error } = await supabase
    .from("sweep_campaigns")
    .select(
      "id,tenant_id,title,opens_at,closes_at,status,is_anonymous,targeting,assessment_version_id",
    )
    .eq("id", campaignId)
    .maybeSingle();
  if (error || !campaign) notFound();
  const { membership } = await workspaceContext(campaign.tenant_id);
  if (membership?.role !== "PARTICIPANT")
    return (
      <WorkspaceShell title={t("Participant check-in")}>
        <p className="panel">
          {t(
            "This check-in requires a participant account in the organization.",
          )}
        </p>
      </WorkspaceShell>
    );
  const [
    { data: version },
    { data: profile },
    { data: consent },
    { data: draft },
    { data: submission },
  ] = await Promise.all([
    supabase
      .from("sweep_assessment_versions")
      .select("definition,published_at")
      .eq("id", campaign.assessment_version_id)
      .eq("tenant_id", campaign.tenant_id)
      .maybeSingle(),
    supabase
      .from("sweep_profiles")
      .select("adult_confirmed,locale")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("sweep_consents")
      .select("granted")
      .eq("tenant_id", campaign.tenant_id)
      .eq("participant_id", user.id)
      .eq("category", "CORE_ASSESSMENT")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sweep_assessment_drafts")
      .select("responses")
      .eq("campaign_id", campaign.id)
      .eq("participant_id", user.id)
      .maybeSingle(),
    supabase
      .from("sweep_assessment_submissions")
      .select("id")
      .eq("campaign_id", campaign.id)
      .eq("participant_id", user.id)
      .maybeSingle(),
  ]);
  if (submission) redirect("/dashboard");
  if (!profile?.adult_confirmed || !consent?.granted)
    return (
      <WorkspaceShell title={t("Before your check-in")}>
        <div className="panel">
          <p>
            {t(
              "Complete your participant profile and make your consent choice before starting.",
            )}
          </p>
          <a className="button mt-4" href="/dashboard">
            {t("Open profile and consent")}
          </a>
        </div>
      </WorkspaceShell>
    );
  if (
    campaign.status !== "ACTIVE" ||
    new Date(campaign.opens_at) > new Date() ||
    new Date(campaign.closes_at) <= new Date() ||
    campaign.is_anonymous ||
    JSON.stringify(campaign.targeting) !== "{}" ||
    !version?.published_at
  )
    return (
      <WorkspaceShell title={t("Check-in unavailable")}>
        <p className="panel">
          {t(
            "This check-in is not currently open in the supported identified campaign mode.",
          )}
        </p>
      </WorkspaceShell>
    );
  return (
    <WorkspaceShell title={campaign.title}>
      <CheckInForm
        campaignId={campaign.id}
        questions={version.definition.questions}
        initialResponses={draft?.responses ?? {}}
        locale={locale}
      />
    </WorkspaceShell>
  );
}
