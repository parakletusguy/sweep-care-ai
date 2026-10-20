import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceContext, tenantName } from "@/lib/workspace";
import { saveConsent, saveProfile } from "../workspace-actions";
import { participantCopy } from "@/lib/locale";
import { serverLocale } from "@/lib/server-locale";
import { roleLabel } from "@/lib/ui-copy";

const copy = {
  en: {
    title: "Your wellbeing space",
    checkins: "Available check-ins",
    results: "Your saved results",
    empty: "No check-ins are currently open for your account.",
    start: "Open check-in",
    saved: "No results yet. Your submitted check-ins will appear here.",
    privacy:
      "Your answers and personal results are private to you in this workspace. Organization administrators and HR cannot read them.",
    profile: "Your profile",
    consent: "Your choice",
    save: "Save profile",
  },
  fr: {
    title: "Votre espace bien-être",
    checkins: "Bilans disponibles",
    results: "Vos résultats enregistrés",
    empty: "Aucun bilan ouvert pour votre compte.",
    start: "Ouvrir le bilan",
    saved: "Vos bilans soumis apparaîtront ici.",
    privacy:
      "Vos réponses et résultats personnels restent privés dans cet espace. Les administrateurs et les RH ne peuvent pas les lire.",
    profile: "Votre profil",
    consent: "Votre choix",
    save: "Enregistrer le profil",
  },
  es: {
    title: "Tu espacio de bienestar",
    checkins: "Cuestionarios disponibles",
    results: "Tus resultados guardados",
    empty: "No hay cuestionarios abiertos para tu cuenta.",
    start: "Abrir cuestionario",
    saved: "Tus cuestionarios enviados aparecerán aquí.",
    privacy:
      "Tus respuestas y resultados personales son privados en este espacio. Los administradores y RR. HH. no pueden leerlos.",
    profile: "Tu perfil",
    consent: "Tu elección",
    save: "Guardar perfil",
  },
};

export default async function ParticipantDashboardPage() {
  const { supabase, user, memberships, membership } = await workspaceContext();
  if (!membership) redirect("/onboarding");
  const [
    { data: profile },
    { data: campaigns, error: campaignError },
    { data: results, error: resultError },
    { data: consents, error: consentError },
  ] = await Promise.all([
    supabase
      .from("sweep_profiles")
      .select("full_name,locale,adult_confirmed")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("sweep_campaigns")
      .select("id,tenant_id,title,closes_at")
      .eq("status", "ACTIVE")
      .eq("is_anonymous", false)
      .gt("closes_at", new Date().toISOString())
      .lte("opens_at", new Date().toISOString()),
    supabase
      .from("sweep_assessment_submissions")
      .select("id,campaign_id,score_snapshot,submitted_at")
      .eq("participant_id", user.id)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("sweep_consents")
      .select("tenant_id,granted,recorded_at")
      .eq("participant_id", user.id)
      .eq("category", "CORE_ASSESSMENT")
      .order("recorded_at", { ascending: false }),
  ]);
  if (campaignError || resultError || consentError)
    throw new Error("Unable to load your wellbeing workspace.");
  const { locale, t: common } = await serverLocale();
  const t = copy[locale];
  const ui = participantCopy[locale];
  const participantTenants = new Set(
    memberships.filter((m) => m.role === "PARTICIPANT").map((m) => m.tenant_id),
  );
  const done = new Set((results ?? []).map((r) => r.campaign_id));
  return (
    <WorkspaceShell title={t.title}>
      <div lang={locale}>
        <p className="muted mb-6">{t.privacy}</p>
        {membership.role !== "PARTICIPANT" ? (
          <div className="panel mb-6">
            <p>
              {common("You are signed in as")}{" "}
              {roleLabel(membership.role, locale)}.
            </p>
            <Link
              className="button mt-3"
              href={
                membership.role === "TRAINER_FACILITATOR"
                  ? "/trainer"
                  : membership.role === "WELLBEING_PROFESSIONAL" ||
                      membership.role === "SAFEGUARDING_OFFICER"
                    ? "/care-team"
                    : "/admin"
              }
            >
              {common("Open your staff workspace")}
            </Link>
          </div>
        ) : null}
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <section className="space-y-6">
            <div className="panel">
              <h2 className="text-xl font-semibold">{t.checkins}</h2>
              <div className="mt-4 space-y-3">
                {(campaigns ?? [])
                  .filter(
                    (c) =>
                      participantTenants.has(c.tenant_id) && !done.has(c.id),
                  )
                  .map((c) => (
                    <article key={c.id} className="rounded-xl border p-4">
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="muted">
                        {ui.closes}{" "}
                        {new Date(c.closes_at).toLocaleDateString(locale)}
                      </p>
                      <Link href={`/check-in/${c.id}`} className="button mt-3">
                        {t.start}
                      </Link>
                    </article>
                  ))}
                {!(campaigns ?? []).some(
                  (c) => participantTenants.has(c.tenant_id) && !done.has(c.id),
                ) ? (
                  <p className="muted">{t.empty}</p>
                ) : null}
              </div>
            </div>
            <div className="panel">
              <h2 className="text-xl font-semibold">{t.results}</h2>
              <p className="muted mt-2">{ui.resultInfo}</p>
              <div className="mt-4 space-y-4">
                {results?.length ? (
                  results.map((result) => (
                    <article key={result.id} className="rounded-xl border p-4">
                      <p className="text-sm text-slate-600">
                        {new Date(result.submitted_at).toLocaleDateString(
                          locale,
                        )}
                      </p>
                      <p className="mt-1 text-2xl font-semibold">
                        {result.score_snapshot.overallIndex}{" "}
                        <span className="text-sm font-normal">
                          / 100 · {ui.calculated}
                        </span>
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {ui.scoringVersion}:{" "}
                        {result.score_snapshot.scoringAlgorithmVersion}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="muted">{t.saved}</p>
                )}
              </div>
            </div>
            <div className="panel">
              <h2 className="text-xl font-semibold">{ui.assistant}</h2>
              <p className="muted mt-2">{ui.assistantInfo}</p>
              <Link href="/assistant" className="button mt-3">
                {ui.openAssistant}
              </Link>
            </div>
          </section>
          <aside className="space-y-6">
            <form action={saveProfile} className="panel space-y-4">
              <h2 className="text-xl font-semibold">{t.profile}</h2>
              <label className="block text-sm">
                {ui.name}
                <input
                  className="field"
                  name="fullName"
                  defaultValue={profile?.full_name ?? ""}
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
              <label className="block text-sm">
                {ui.language}
                <select className="field" name="locale" defaultValue={locale}>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                </select>
              </label>
              <label className="flex gap-3 text-sm leading-6">
                <input
                  type="checkbox"
                  name="adult"
                  defaultChecked={profile?.adult_confirmed}
                  className="mt-1 h-5 w-5 shrink-0"
                />
                {ui.adult}
              </label>
              <button className="button">{t.save}</button>
            </form>
            {memberships
              .filter((m) => m.role === "PARTICIPANT")
              .map((m) => {
                const latest = consents?.find(
                  (c) => c.tenant_id === m.tenant_id,
                );
                return (
                  <section key={m.tenant_id} className="panel">
                    <h2 className="text-xl font-semibold">{t.consent}</h2>
                    <p className="muted mt-2">{tenantName(m.sweep_tenants)}</p>
                    <p className="muted mt-2">{ui.consentInfo}</p>
                    <p className="mt-3 text-sm font-semibold">
                      {ui.currentConsent}:{" "}
                      {latest?.granted ? ui.granted : ui.notGranted}
                    </p>
                    <form action={saveConsent} className="mt-3">
                      <input
                        type="hidden"
                        name="tenantId"
                        value={m.tenant_id}
                      />
                      <input
                        type="hidden"
                        name="granted"
                        value={latest?.granted ? "false" : "true"}
                      />
                      <button className="button">
                        {latest?.granted ? ui.withdraw : ui.grant}
                      </button>
                    </form>
                  </section>
                );
              })}
          </aside>
        </div>
      </div>
    </WorkspaceShell>
  );
}
