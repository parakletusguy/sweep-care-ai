import { serverLocale } from "@/lib/server-locale";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceContext, requireRole } from "@/lib/workspace";

async function addResource(form: FormData) {
  "use server";
  const values = z
    .object({
      tenantId: z.string().uuid(),
      title: z.string().min(2).max(200),
      url: z.string().url().startsWith("https://"),
      excerpt: z.string().min(10).max(6000),
      tags: z.string().min(2).max(500),
    })
    .parse(Object.fromEntries(form));
  const { supabase, user, membership } = await workspaceContext(
    values.tenantId,
  );
  requireRole(membership?.role, ["ORG_ADMIN", "WELLBEING_PROFESSIONAL"]);
  const { error } = await supabase.from("sweep_knowledge_resources").insert({
    tenant_id: values.tenantId,
    title: values.title,
    url: values.url,
    excerpt: values.excerpt,
    tags: values.tags,
    approved_by: user.id,
  });
  if (error) throw new Error("Unable to save approved resource.");
  revalidatePath("/admin/resources");
}
export default async function ResourcePage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { locale, t } = await serverLocale();
  const { tenant } = await searchParams;
  const { supabase, membership } = await workspaceContext(tenant);
  if (
    !membership ||
    !["ORG_ADMIN", "WELLBEING_PROFESSIONAL"].includes(membership.role)
  )
    return (
      <WorkspaceShell title={t("Approved resources")}>
        <p className="panel">{t("Resource-review access is required.")}</p>
      </WorkspaceShell>
    );
  const { data, error } = await supabase
    .from("sweep_knowledge_resources")
    .select("id,title,url,excerpt,approved_at")
    .eq("tenant_id", membership.tenant_id);
  if (error) throw new Error("Unable to load approved resources.");
  return (
    <WorkspaceShell title={t("Approved resources")}>
      <div className="grid gap-6 md:grid-cols-2">
        <form className="panel space-y-4" action={addResource}>
          <h2 className="text-xl font-semibold">
            {t("Review and add a source")}
          </h2>
          <p className="muted">
            {t(
              "Only add content you have reviewed and have permission to share. The assistant displays your exact excerpt with its source link. It does not infer additional claims.",
            )}
          </p>
          <input type="hidden" name="tenantId" value={membership.tenant_id} />
          <label className="block text-sm">
            {t("Title")}
            <input
              className="field"
              name="title"
              required
              minLength={2}
              maxLength={200}
            />
          </label>
          <label className="block text-sm">
            {t("Original source URL")}
            <input
              type="url"
              className="field"
              name="url"
              required
              placeholder="https://"
            />
          </label>
          <label className="block text-sm">
            {t("Approved excerpt")}
            <textarea
              className="field"
              name="excerpt"
              required
              minLength={10}
              maxLength={6000}
              rows={7}
            />
          </label>
          <label className="block text-sm">
            {t("Topic tags")}
            <input
              className="field"
              name="tags"
              required
              placeholder={t("For example: sleep, work, stress")}
            />
          </label>
          <label className="flex gap-3 text-sm leading-6">
            <input type="checkbox" required className="mt-1" />
            {t(
              "I have reviewed this source and approve this excerpt for participants.",
            )}
          </label>
          <button className="button">{t("Approve and add resource")}</button>
        </form>
        <div className="space-y-4">
          {data?.map((r) => (
            <article className="panel" key={r.id}>
              <a
                className="font-semibold text-teal-800 underline"
                href={r.url}
                target="_blank"
                rel="noreferrer"
              >
                {r.title}
              </a>
              <p className="muted mt-3 whitespace-pre-wrap">{r.excerpt}</p>
            </article>
          ))}
          {!data?.length ? (
            <p className="panel muted">
              {t("No organization resources are approved yet.")}
            </p>
          ) : null}
        </div>
      </div>
    </WorkspaceShell>
  );
}
