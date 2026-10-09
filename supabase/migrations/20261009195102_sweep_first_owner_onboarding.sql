-- This deliberately narrow RPC is the only browser-accessible privileged
-- onboarding operation. It creates exactly one initial organisation and can
-- only be used by the authenticated person who becomes its first ORG_ADMIN.
-- Subsequent tenant provisioning must use an audited staff workflow.
create or replace function public.sweep_bootstrap_first_owner(
  p_full_name text,
  p_tenant_name text,
  p_tenant_slug text,
  p_sector text
)
returns table (tenant_id uuid, tenant_slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_tenant_id uuid;
begin
  if v_user_id is null then
    raise exception 'SWEEP_AUTH_REQUIRED: sign in before setting up an organisation'
      using errcode = '28000';
  end if;

  if char_length(trim(p_full_name)) < 2 or char_length(trim(p_full_name)) > 120 then
    raise exception 'SWEEP_INVALID_NAME: enter a name between 2 and 120 characters'
      using errcode = '22023';
  end if;

  if char_length(trim(p_tenant_name)) < 2 or char_length(trim(p_tenant_name)) > 160 then
    raise exception 'SWEEP_INVALID_ORGANISATION: enter an organisation name between 2 and 160 characters'
      using errcode = '22023';
  end if;

  if p_tenant_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'SWEEP_INVALID_SLUG: use lower-case letters, numbers, and single hyphens only'
      using errcode = '22023';
  end if;

  if p_sector not in ('corporate', 'school', 'church', 'training') then
    raise exception 'SWEEP_INVALID_SECTOR: select a supported sector'
      using errcode = '22023';
  end if;

  -- Avoid a race where two newly signed-in users try to become the first
  -- organisation owner at the same time.
  perform pg_advisory_xact_lock(hashtext('sweep-first-owner-bootstrap'));

  if exists (
    select 1
    from public.sweep_memberships membership
    where membership.user_id = v_user_id
  ) then
    raise exception 'SWEEP_ALREADY_ONBOARDED: this account already belongs to an organisation'
      using errcode = '55000';
  end if;

  if exists (select 1 from public.sweep_tenants) then
    raise exception 'SWEEP_FIRST_OWNER_ALREADY_EXISTS: the initial owner has already set up SWEEP Care'
      using errcode = '55000';
  end if;

  insert into public.sweep_tenants (slug, name, sector)
  values (p_tenant_slug, trim(p_tenant_name), p_sector)
  returning id into v_tenant_id;

  insert into public.sweep_tenant_policies (tenant_id)
  values (v_tenant_id);

  insert into public.sweep_profiles (id, full_name)
  values (v_user_id, trim(p_full_name))
  on conflict (id) do update set full_name = excluded.full_name;

  insert into public.sweep_memberships (tenant_id, user_id, role)
  values (v_tenant_id, v_user_id, 'ORG_ADMIN');

  insert into public.sweep_audit_events (
    tenant_id,
    actor_id,
    action,
    classification,
    resource_type,
    resource_id,
    details
  ) values (
    v_tenant_id,
    v_user_id,
    'FIRST_OWNER_ONBOARDED',
    'CLASS_C_PERSONAL',
    'tenant',
    v_tenant_id::text,
    jsonb_build_object('sector', p_sector)
  );

  return query select v_tenant_id, p_tenant_slug;
end;
$$;

revoke all on function public.sweep_bootstrap_first_owner(text, text, text, text)
  from public, anon;
grant execute on function public.sweep_bootstrap_first_owner(text, text, text, text)
  to authenticated;
