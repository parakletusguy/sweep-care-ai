import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceContext, tenantName } from "@/lib/workspace";
import { inviteMember, changeMember } from "../workspace-actions";
import { AssessmentBuilder } from "./assessment-builder";

const roles = [
  "PARTICIPANT",
  "ORG_ADMIN",
  "WELLBEING_PROFESSIONAL",
  "SAFEGUARDING_OFFICER",
  "HR_MANAGER",
  "TRAINER_FACILITATOR",
];
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const { supabase, memberships, membership } = await workspaceContext(
    params.tenant,
  );
  if (
    !membership ||
    !["ORG_ADMIN", "WELLBEING_PROFESSIONAL"].includes(membership.role)
  )
    return (
      <WorkspaceShell title="Organization workspace">
        <p className="panel">
          This workspace requires an organization administrator or wellbeing
          professional role.
        </p>
      </WorkspaceShell>
    );
  const tenant = membership.tenant_id;
  const [
    { data: directory, error: directoryError },
    { data: invitations, error: inviteError },
    { data: campaigns, error: campaignError },
  ] = await Promise.all([
    membership.role === "ORG_ADMIN"
      ? supabase.rpc("sweep_directory", { p_tenant: tenant })
      : Promise.resolve({ data: null, error: null }),
    membership.role === "ORG_ADMIN"
      ? supabase
          .from("sweep_invitations")
          .select("id,email,role,accepted_at,expires_at")
          .eq("tenant_id", tenant)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("sweep_campaigns")
      .select("id,title,status,closes_at")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false }),
  ]);
  if (directoryError || inviteError || campaignError)
    throw new Error("Unable to load organization records.");
  return (
    <WorkspaceShell title={tenantName(membership.sweep_tenants)}>
      <nav className="mb-5 flex flex-wrap gap-3">
        {memberships
          .filter((m) =>
            ["ORG_ADMIN", "WELLBEING_PROFESSIONAL"].includes(m.role),
          )
          .map((m) => (
            <Link
              className="rounded-lg border bg-white px-3 py-2 text-sm"
              key={m.tenant_id}
              href={`/admin?tenant=${m.tenant_id}`}
            >
              {tenantName(m.sweep_tenants)}
            </Link>
          ))}
        <Link
          className="rounded-lg border bg-white px-3 py-2 text-sm"
          href={`/admin/resources?tenant=${tenant}`}
        >
          Approved resources
        </Link>
        <Link
          className="rounded-lg border bg-white px-3 py-2 text-sm"
          href={`/admin/connections?tenant=${tenant}`}
        >
          Enterprise connections
        </Link>
      </nav>
      {params.notice ? (
        <p role="status" className="panel mb-5">
          {params.notice === "invitation-email-accepted"
            ? "Invitation saved. The email provider accepted the sign-in request; delivery is not yet confirmed."
            : "Invitation saved, but the sign-in email could not be sent. Share the sign-in page with the invitee and retry when email service is available."}
        </p>
      ) : null}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {membership.role === "ORG_ADMIN" ? (
            <>
              <form action={inviteMember} className="panel space-y-4">
                <h2 className="text-xl font-semibold">Invite a member</h2>
                <p className="muted">
                  The invitation is bound to their verified email. Staff roles
                  grant access to the named workflow; choose carefully.
                </p>
                <input type="hidden" name="tenantId" value={tenant} />
                <label className="block text-sm">
                  Email
                  <input className="field" type="email" name="email" required />
                </label>
                <label className="block text-sm">
                  Role
                  <select className="field" name="role">
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button">
                  Save invitation and request email
                </button>
              </form>
              <section className="panel">
                <h2 className="text-xl font-semibold">Members</h2>
                <div className="mt-4 space-y-4">
                  {(
                    directory as
                      | {
                          user_id: string;
                          email: string;
                          full_name: string | null;
                          role: string;
                          is_active: boolean;
                        }[]
                      | null
                  )?.map((m) => (
                    <form
                      action={changeMember}
                      className="rounded-xl border p-3"
                      key={m.user_id}
                    >
                      <p className="font-medium">{m.full_name || m.email}</p>
                      <p className="muted break-all">{m.email}</p>
                      <input type="hidden" name="tenantId" value={tenant} />
                      <input type="hidden" name="userId" value={m.user_id} />
                      <label className="sr-only" htmlFor={`role-${m.user_id}`}>
                        Role for {m.email}
                      </label>
                      <select
                        id={`role-${m.user_id}`}
                        className="field"
                        name="role"
                        defaultValue={m.role}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                      <label className="flex min-h-11 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="active"
                          defaultChecked={m.is_active}
                        />
                        Active access
                      </label>
                      <button className="button">Update access</button>
                    </form>
                  ))}
                </div>
              </section>
              <section className="panel">
                <h2 className="text-xl font-semibold">Invitations</h2>
                <ul className="mt-4 space-y-3">
                  {invitations?.map((i) => (
                    <li key={i.id} className="text-sm">
                      <span className="font-medium">{i.email}</span> ·{" "}
                      {i.accepted_at
                        ? "Accepted"
                        : new Date(i.expires_at) < new Date()
                          ? "Expired"
                          : "Awaiting acceptance"}
                      <p className="text-xs text-slate-500">
                        {i.role.replaceAll("_", " ")}
                      </p>
                    </li>
                  ))}
                </ul>
                {!invitations?.length ? (
                  <p className="muted mt-3">No invitations yet.</p>
                ) : null}
              </section>
            </>
          ) : null}
        </div>
        <div className="space-y-6">
          <AssessmentBuilder tenantId={tenant} />
          <section className="panel">
            <h2 className="text-xl font-semibold">Published campaigns</h2>
            <ul className="mt-4 space-y-3">
              {campaigns?.map((c) => (
                <li key={c.id} className="rounded-lg border p-3">
                  <p className="font-medium">{c.title}</p>
                  <p className="muted">
                    {c.status} · Closes{" "}
                    {new Date(c.closes_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
            {!campaigns?.length ? (
              <p className="muted mt-3">
                Create your first reviewed check-in above.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
