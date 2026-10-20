import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceContext } from "@/lib/workspace";
import { serverLocale } from "@/lib/server-locale";

export default async function ReportsPage() {
  await workspaceContext();
  const { t } = await serverLocale();
  return (
    <WorkspaceShell title={t("Reports")}>
      <section className="panel max-w-2xl">
        <h2 className="text-xl font-semibold">
          {t("Reports are not available yet.")}
        </h2>
        <p className="muted mt-3">
          {t(
            "No verified population report is connected to this screen. Sample figures and simulated exports have been removed. Your organization’s individual answers are not displayed here.",
          )}
        </p>
        <Link href="/dashboard" className="button mt-5">
          {t("Return to my space")}
        </Link>
      </section>
    </WorkspaceShell>
  );
}
