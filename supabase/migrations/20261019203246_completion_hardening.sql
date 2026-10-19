-- Keep all elevated functions in the private schema. Public entry points are
-- invoker wrappers around the existing, explicitly authorized operations.
alter function public.sweep_bootstrap_first_owner(text,text,text,text) set schema private;
create function public.sweep_bootstrap_first_owner(p_full_name text,p_tenant_name text,p_tenant_slug text,p_sector text)
returns table(tenant_id uuid,tenant_slug text) language sql security invoker set search_path='' as $$
  select * from private.sweep_bootstrap_first_owner(p_full_name,p_tenant_name,p_tenant_slug,p_sector);
$$;
alter function public.sweep_record_case_read(uuid[]) set schema private;
create function public.sweep_record_case_read(p_case_ids uuid[]) returns void language sql security invoker set search_path='' as $$
  select private.sweep_record_case_read(p_case_ids);
$$;
revoke all on function public.sweep_bootstrap_first_owner(text,text,text,text),public.sweep_record_case_read(uuid[]),private.sweep_bootstrap_first_owner(text,text,text,text),private.sweep_record_case_read(uuid[]) from public,anon;
grant execute on function public.sweep_bootstrap_first_owner(text,text,text,text),public.sweep_record_case_read(uuid[]),private.sweep_bootstrap_first_owner(text,text,text,text),private.sweep_record_case_read(uuid[]) to authenticated;

create function private.sweep_can_bootstrap() returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and not exists(select 1 from public.sweep_tenants);
$$;
create function public.sweep_can_bootstrap() returns boolean language sql security invoker set search_path='' as $$ select private.sweep_can_bootstrap(); $$;
revoke all on function private.sweep_can_bootstrap(),public.sweep_can_bootstrap() from public,anon;
grant execute on function private.sweep_can_bootstrap(),public.sweep_can_bootstrap() to authenticated;

-- Facilitators receive only the roster of sessions assigned to them, after
-- approval. No email directory or wellbeing scores are exposed.
create function private.sweep_session_roster(p_tenant uuid)
returns table(session_id uuid,participant_id uuid,full_name text,attended boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  if not private.sweep_has_role(p_tenant,array['ORG_ADMIN','WELLBEING_PROFESSIONAL','TRAINER_FACILITATOR']) then raise exception 'Session access required' using errcode='42501';end if;
  return query select e.session_id,e.participant_id,p.full_name,e.attended from public.sweep_session_enrollments e
    join public.sweep_delivery_sessions s on s.id=e.session_id and s.tenant_id=e.tenant_id
    left join public.sweep_profiles p on p.id=e.participant_id
    where e.tenant_id=p_tenant and (private.sweep_has_role(p_tenant,array['ORG_ADMIN','WELLBEING_PROFESSIONAL']) or (s.facilitator_id=auth.uid() and s.status<>'DRAFT'));
end; $$;
create function public.sweep_session_roster(p_tenant uuid)
returns table(session_id uuid,participant_id uuid,full_name text,attended boolean)
language sql security invoker set search_path='' as $$ select * from private.sweep_session_roster(p_tenant); $$;
revoke all on function private.sweep_session_roster(uuid),public.sweep_session_roster(uuid) from public,anon;
grant execute on function private.sweep_session_roster(uuid),public.sweep_session_roster(uuid) to authenticated;

create function private.sweep_is_enrolled(p_session uuid,p_tenant uuid) returns boolean language sql stable security definer set search_path='' as $$
  select private.sweep_has_role(p_tenant,array['PARTICIPANT']) and exists(select 1 from public.sweep_session_enrollments where session_id=p_session and tenant_id=p_tenant and participant_id=auth.uid());
$$;
revoke all on function private.sweep_is_enrolled(uuid,uuid) from public,anon;
grant execute on function private.sweep_is_enrolled(uuid,uuid) to authenticated;
create policy sweep_session_participant_read on public.sweep_delivery_sessions for select to authenticated
using(status<>'DRAFT' and private.sweep_is_enrolled(id,tenant_id));

-- New published versions are fixed from publication, not only after the first
-- response. Staff publish a new version instead of rewriting history.
create or replace function private.sweep_prevent_version_mutation()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.published_at is not null or exists(select 1 from public.sweep_assessment_submissions where assessment_version_id=old.id) then
    raise exception 'Published assessment versions cannot be changed or deleted' using errcode='55000';
  end if;
  if tg_op='DELETE' then return old;end if;
  return new;
end; $$;
