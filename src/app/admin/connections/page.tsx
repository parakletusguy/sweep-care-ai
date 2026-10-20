import { serverLocale } from "@/lib/server-locale";
import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceContext } from "@/lib/workspace";
export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { locale, t } = await serverLocale();
  const { tenant } = await searchParams;
  const { membership } = await workspaceContext(tenant);
  if (membership?.role !== "ORG_ADMIN")
    return (
      <WorkspaceShell title={t("Enterprise connections")}>
        <p className="panel">
          {t("Organization-administrator access is required.")}
        </p>
      </WorkspaceShell>
    );
  return (
    <WorkspaceShell title={t("Enterprise connections")}>
      <p className="muted mb-5">
        {t(
          "No enterprise identity or learning provider has been selected for this organization. Email sign-in remains available.",
        )}
      </p>
      <div className="grid gap-5 md:grid-cols-3">
        {[
          {
            title: t("Single sign-on (SAML)"),
            description: t(
              "Inactive. Activation requires the identity provider’s metadata URL or signed metadata document, verified domains, a Supabase plan supporting SAML, and a live sign-in test.",
            ),
          },
          {
            title: t("Directory provisioning (SCIM)"),
            description: t(
              "Inactive. Activation requires a chosen directory provider, a narrowly scoped provisioning credential, role-mapping review, and tests for provisioning and deactivation.",
            ),
          },
          {
            title: t("Learning management system"),
            description: t(
              "Inactive. Activation requires the LMS vendor, its base URL, a scoped API credential, the courses to synchronize, and an approved participant-data mapping.",
            ),
          },
        ].map((item) => (
          <section className="panel" key={item.title}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("Not connected")}
            </p>
            <h2 className="mt-3 text-lg font-semibold">{item.title}</h2>
            <p className="muted mt-3">{item.description}</p>
          </section>
        ))}
      </div>
    </WorkspaceShell>
  );
}
