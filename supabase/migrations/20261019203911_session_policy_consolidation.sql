drop policy sweep_session_participant_read on public.sweep_delivery_sessions;
drop policy sweep_sessions_staff_read on public.sweep_delivery_sessions;
create policy sweep_sessions_authorized_read on public.sweep_delivery_sessions
for select to authenticated using (
  private.sweep_has_role(tenant_id,array['ORG_ADMIN','WELLBEING_PROFESSIONAL'])
  or (status<>'DRAFT' and (
    (facilitator_id=(select auth.uid()) and private.sweep_has_role(tenant_id,array['TRAINER_FACILITATOR']))
    or private.sweep_is_enrolled(id,tenant_id)
  ))
);
