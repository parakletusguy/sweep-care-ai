import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceContext } from "@/lib/workspace";
import { sessionCommand } from "./actions";
type Member = {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
};
function SessionFields({
  tenant,
  id,
  command,
}: {
  tenant: string;
  id: string;
  command: string;
}) {
  return (
    <>
      <input type="hidden" name="tenantId" value={tenant} />
      <input type="hidden" name="sessionId" value={id} />
      <input type="hidden" name="command" value={command} />
    </>
  );
}
export default async function TrainerPage() {
  const { supabase, user, membership } = await workspaceContext();
  if (
    !membership ||
    !["ORG_ADMIN", "WELLBEING_PROFESSIONAL", "TRAINER_FACILITATOR"].includes(
      membership.role,
    )
  )
    return (
      <WorkspaceShell title="Programme sessions">
        <p className="panel">
          You need a facilitator, professional, or organization-administrator
          role.
        </p>
      </WorkspaceShell>
    );
  const tenant = membership.tenant_id;
  const [
    { data: sessions, error },
    { data: rawEnrollments, error: enrollError },
    { data: directory, error: dirError },
  ] = await Promise.all([
    supabase
      .from("sweep_delivery_sessions")
      .select("id,title,materials,facilitator_id,scheduled_at,status")
      .eq("tenant_id", tenant)
      .order("scheduled_at"),
    supabase.rpc("sweep_session_roster", { p_tenant: tenant }),
    membership.role === "ORG_ADMIN"
      ? supabase.rpc("sweep_directory", { p_tenant: tenant })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (error || enrollError || dirError)
    throw new Error("Unable to load programme sessions.");
  const members = (directory ?? []) as Member[];
  const enrollments = (rawEnrollments ?? []) as {
    session_id: string;
    participant_id: string;
    full_name: string | null;
    attended: boolean;
  }[];
  return (
    <WorkspaceShell title="Programme sessions">
      <p className="muted mb-5">
        Facilitators see their assigned approved sessions and attendance
        records. Personal assessment answers and care notes are not included.
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {membership.role === "ORG_ADMIN" ? (
          <form action={sessionCommand} className="panel space-y-4">
            <h2 className="text-xl font-semibold">Prepare a session</h2>
            <input type="hidden" name="tenantId" value={tenant} />
            <input type="hidden" name="command" value="CREATE" />
            <label className="block text-sm">
              Title
              <input
                className="field"
                name="title"
                required
                minLength={2}
                maxLength={200}
              />
            </label>
            <label className="block text-sm">
              Facilitator
              <select className="field" name="facilitatorId" required>
                <option value="">Select an active facilitator</option>
                {members
                  .filter(
                    (m) => m.role === "TRAINER_FACILITATOR" && m.is_active,
                  )
                  .map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name || m.email}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block text-sm">
              Scheduled time
              <input
                type="datetime-local"
                className="field"
                name="scheduledAt"
                required
              />
            </label>
            <label className="block text-sm">
              Reviewed session materials
              <textarea
                className="field"
                name="materials"
                rows={6}
                required
                maxLength={12000}
              />
            </label>
            <button className="button">Save session for review</button>
          </form>
        ) : null}
        <div className="space-y-5">
          {sessions?.map((s) => (
            <article className="panel" key={s.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                {s.status}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{s.title}</h2>
              <p className="muted mt-1">
                {new Date(s.scheduled_at).toLocaleString()}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                {s.materials}
              </p>
              {s.status === "DRAFT" &&
              ["ORG_ADMIN", "WELLBEING_PROFESSIONAL"].includes(
                membership.role,
              ) ? (
                <form action={sessionCommand} className="mt-4">
                  <SessionFields tenant={tenant} id={s.id} command="APPROVE" />
                  <button className="button">Approve reviewed session</button>
                </form>
              ) : null}
              {membership.role === "ORG_ADMIN" && s.status !== "COMPLETED" ? (
                <form action={sessionCommand} className="mt-4 flex gap-2">
                  <SessionFields tenant={tenant} id={s.id} command="ENROLL" />
                  <label className="sr-only" htmlFor={`enroll-${s.id}`}>
                    Participant to enroll
                  </label>
                  <select
                    id={`enroll-${s.id}`}
                    name="participantId"
                    required
                    className="field"
                  >
                    <option value="">Enroll a participant</option>
                    {members
                      .filter((m) => m.role === "PARTICIPANT" && m.is_active)
                      .map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.full_name || m.email}
                        </option>
                      ))}
                  </select>
                  <button className="button">Enroll</button>
                </form>
              ) : null}
              <h3 className="mt-5 font-semibold">Attendance</h3>
              <ul className="mt-2 space-y-2">
                {enrollments
                  ?.filter((e) => e.session_id === s.id)
                  .map((enrollment, index) => (
                    <li
                      key={enrollment.participant_id}
                      className="rounded-lg border p-3"
                    >
                      <p className="text-sm">
                        {enrollment.full_name || `Participant ${index + 1}`} ·{" "}
                        {enrollment.attended ? "Present" : "Not marked present"}
                      </p>
                      {s.facilitator_id === user.id &&
                      s.status === "APPROVED" ? (
                        <form action={sessionCommand} className="mt-2">
                          <SessionFields
                            tenant={tenant}
                            id={s.id}
                            command="ATTENDANCE"
                          />
                          <input
                            type="hidden"
                            name="participantId"
                            value={enrollment.participant_id}
                          />
                          <input
                            type="hidden"
                            name="attended"
                            value={String(!enrollment.attended)}
                          />
                          <button className="min-h-11 text-sm font-semibold text-teal-800 underline">
                            {enrollment.attended
                              ? "Mark absent"
                              : "Mark present"}
                          </button>
                        </form>
                      ) : null}
                    </li>
                  ))}
              </ul>
              {s.facilitator_id === user.id && s.status === "APPROVED" ? (
                <form action={sessionCommand} className="mt-4">
                  <SessionFields tenant={tenant} id={s.id} command="COMPLETE" />
                  <button className="button">Mark session completed</button>
                </form>
              ) : null}
            </article>
          ))}
          {!sessions?.length ? (
            <p className="panel muted">
              No sessions are available to your role yet.
            </p>
          ) : null}
        </div>
      </div>
    </WorkspaceShell>
  );
}
