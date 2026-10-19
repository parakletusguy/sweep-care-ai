import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceContext } from "@/lib/workspace";
export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { tenant } = await searchParams;
  const { membership } = await workspaceContext(tenant);
  if (membership?.role !== "ORG_ADMIN")
    return (
      <WorkspaceShell title="Enterprise connections">
        <p className="panel">Organization-administrator access is required.</p>
      </WorkspaceShell>
    );
  return (
    <WorkspaceShell title="Enterprise connections">
      <p className="muted mb-5">
        No enterprise identity or learning provider has been selected for this
        organization. Email sign-in remains available.
      </p>
      <div className="grid gap-5 md:grid-cols-3">
        {[
          {
            title: "Single sign-on (SAML)",
            description:
              "Inactive. Activation requires the identity provider’s metadata URL or signed metadata document, verified domains, a Supabase plan supporting SAML, and a live sign-in test.",
          },
          {
            title: "Directory provisioning (SCIM)",
            description:
              "Inactive. Activation requires a chosen directory provider, a narrowly scoped provisioning credential, role-mapping review, and tests for provisioning and deactivation.",
          },
          {
            title: "Learning management system",
            description:
              "Inactive. Activation requires the LMS vendor, its base URL, a scoped API credential, the courses to synchronize, and an approved participant-data mapping.",
          },
        ].map((item) => (
          <section className="panel" key={item.title}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Not connected
            </p>
            <h2 className="mt-3 text-lg font-semibold">{item.title}</h2>
            <p className="muted mt-3">{item.description}</p>
          </section>
        ))}
      </div>
    </WorkspaceShell>
  );
}
