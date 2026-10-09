-- Lock down a pre-existing privileged function that is not used by this app.
-- The repository contains no RPC caller for it; external clients must not be
-- able to invoke a SECURITY DEFINER function in the exposed public schema.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Audit data is written only by the private database trigger. This explicit
-- deny policy documents that no browser role can read or write audit records
-- and keeps the table protected even if a future grant is added accidentally.
create policy sweep_audit_events_deny_client_access
  on public.sweep_audit_events
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
