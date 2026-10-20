import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceContext, tenantName } from "@/lib/workspace";
import { ResourceAssistant } from "./resource-assistant";
import { serverLocale } from "@/lib/server-locale";
export default async function AssistantPage() {
  const { t } = await serverLocale();
  const { memberships } = await workspaceContext();
  const permitted = memberships.filter((m) => m.role === "PARTICIPANT");
  return (
    <WorkspaceShell title={t("Resource assistant")}>
      {permitted.length ? (
        <ResourceAssistant
          organizations={permitted.map((m) => ({
            id: m.tenant_id,
            name: tenantName(m.sweep_tenants),
          }))}
        />
      ) : (
        <p className="panel">
          {t("A participant role is required to open this workspace.")}
        </p>
      )}
    </WorkspaceShell>
  );
}
