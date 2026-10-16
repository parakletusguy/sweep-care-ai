-- Phase 2A: persistent, tenant-isolated professional case management.
--
-- These tables deliberately use the reviewed `sweep_` namespace. The
-- similarly named legacy public tables predate the application foundation and
-- are not an application data source.

create table public.sweep_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.sweep_tenants(id) on delete restrict,
  participant_id uuid not null,
  title text not null check (char_length(trim(title)) between 2 and 160),
  description text not null check (char_length(trim(description)) between 2 and 12000),
  status text not null default 'OPEN' check (status in (
    'OPEN', 'IN_REVIEW', 'ACTIVE_SUPPORT', 'REFERRED', 'ESCALATED', 'RESOLVED', 'CLOSED'
  )),
  priority text not null default 'ROUTINE' check (priority in ('ROUTINE', 'ELEVATED', 'URGENT', 'CRISIS')),
  classification text not null default 'CLASS_D_SENSITIVE_WELLBEING' check (classification in (
    'CLASS_D_SENSITIVE_WELLBEING', 'CLASS_F_SAFEGUARDING'
  )),
  assigned_professional_id uuid,
  opened_by_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (id, tenant_id),
  foreign key (tenant_id, participant_id)
    references public.sweep_memberships(tenant_id, user_id) on delete restrict,
  foreign key (tenant_id, opened_by_id)
    references public.sweep_memberships(tenant_id, user_id) on delete restrict,
  foreign key (tenant_id, assigned_professional_id)
    references public.sweep_memberships(tenant_id, user_id) on delete restrict,
  check ((status <> 'CLOSED') or closed_at is not null)
);

create table public.sweep_case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  tenant_id uuid not null,
  author_id uuid not null,
  content text not null check (char_length(trim(content)) between 1 and 12000),
  classification text not null check (classification in (
    'CLASS_D_SENSITIVE_WELLBEING', 'CLASS_F_SAFEGUARDING'
  )),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (case_id, tenant_id)
    references public.sweep_cases(id, tenant_id) on delete restrict,
  foreign key (tenant_id, author_id)
    references public.sweep_memberships(tenant_id, user_id) on delete restrict
);

create table public.sweep_referrals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  tenant_id uuid not null,
  participant_id uuid not null,
  referred_by_id uuid not null,
  assigned_professional_id uuid,
  type text not null check (type in (
    'INTERNAL_PROGRAMME', 'INTERNAL_SPECIALIST', 'EXTERNAL_EAP', 'EXTERNAL_CLINICAL', 'COMMUNITY_SUPPORT'
  )),
  status text not null default 'PENDING_REVIEW' check (status in (
    'PENDING_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REFERRED_EXTERNAL',
    'COMPLETED', 'DECLINED', 'CANCELLED'
  )),
  provider_name text not null check (char_length(trim(provider_name)) between 2 and 200),
  external_contact_info text check (external_contact_info is null or char_length(trim(external_contact_info)) <= 500),
  reason text not null check (char_length(trim(reason)) between 2 and 6000),
  notes text check (notes is null or char_length(trim(notes)) <= 6000),
  classification text not null check (classification in (
    'CLASS_D_SENSITIVE_WELLBEING', 'CLASS_F_SAFEGUARDING'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, tenant_id),
  foreign key (case_id, tenant_id)
    references public.sweep_cases(id, tenant_id) on delete restrict,
  foreign key (tenant_id, participant_id)
    references public.sweep_memberships(tenant_id, user_id) on delete restrict,
  foreign key (tenant_id, referred_by_id)
    references public.sweep_memberships(tenant_id, user_id) on delete restrict,
  foreign key (tenant_id, assigned_professional_id)
    references public.sweep_memberships(tenant_id, user_id) on delete restrict,
  check ((status <> 'COMPLETED') or completed_at is not null)
);

create index sweep_cases_tenant_status_priority_idx
  on public.sweep_cases (tenant_id, status, priority, updated_at desc);

create index sweep_cases_assigned_professional_idx
  on public.sweep_cases (tenant_id, assigned_professional_id, updated_at desc)
  where assigned_professional_id is not null;

create index sweep_cases_participant_idx
  on public.sweep_cases (tenant_id, participant_id, updated_at desc);

create index sweep_case_notes_case_created_idx
  on public.sweep_case_notes (tenant_id, case_id, created_at);

create index sweep_referrals_case_status_idx
  on public.sweep_referrals (tenant_id, case_id, status, updated_at desc);

-- This is the single, role-aware predicate used by every case-table policy.
-- ORG_ADMIN, HR, Trainer and Super Admin do not receive sensitive individual
-- record access by default. Any future exception needs its own reviewed,
-- explicit permission model rather than weakening this default.
create function private.sweep_can_access_case(
  p_tenant_id uuid,
  p_classification text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.sweep_memberships membership
    where membership.tenant_id = p_tenant_id
      and membership.user_id = (select auth.uid())
      and membership.is_active
      and (
        (p_classification = 'CLASS_D_SENSITIVE_WELLBEING'
          and membership.role = 'WELLBEING_PROFESSIONAL')
        or
        (p_classification = 'CLASS_F_SAFEGUARDING'
          and membership.role = 'SAFEGUARDING_OFFICER')
      )
  );
$$;

-- Defence in depth for server-side or future direct writes: a case cannot be
-- assigned across tenants or to a role that is not allowed for its class, and
-- notes/referrals cannot be attached to a different participant or class.
create function private.sweep_validate_case_relationship()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case_classification text;
  v_case_participant_id uuid;
  v_assignee_role text;
begin
  if tg_table_name = 'sweep_cases' then
    if new.assigned_professional_id is not null then
      select membership.role into v_assignee_role
      from public.sweep_memberships membership
      where membership.tenant_id = new.tenant_id
        and membership.user_id = new.assigned_professional_id
        and membership.is_active;

      if (new.classification = 'CLASS_D_SENSITIVE_WELLBEING'
          and v_assignee_role is distinct from 'WELLBEING_PROFESSIONAL')
        or
         (new.classification = 'CLASS_F_SAFEGUARDING'
          and v_assignee_role is distinct from 'SAFEGUARDING_OFFICER') then
        raise exception 'SWEEP_INVALID_CASE_ASSIGNEE: assignee is not authorized for this record class'
          using errcode = '42501';
      end if;
    end if;
    return new;
  end if;

  select case_record.classification, case_record.participant_id
    into v_case_classification, v_case_participant_id
  from public.sweep_cases case_record
  where case_record.id = new.case_id
    and case_record.tenant_id = new.tenant_id;

  if not found then
    raise exception 'SWEEP_CASE_NOT_FOUND: related case is not available in this tenant'
      using errcode = '23503';
  end if;

  if new.classification is distinct from v_case_classification then
    raise exception 'SWEEP_CASE_CLASSIFICATION_MISMATCH: related records must keep the case classification'
      using errcode = '23514';
  end if;

  if tg_table_name = 'sweep_referrals' then
    if new.participant_id is distinct from v_case_participant_id then
      raise exception 'SWEEP_CASE_PARTICIPANT_MISMATCH: referrals must keep the case participant'
        using errcode = '23514';
    end if;

    if new.assigned_professional_id is not null then
      select membership.role into v_assignee_role
      from public.sweep_memberships membership
      where membership.tenant_id = new.tenant_id
        and membership.user_id = new.assigned_professional_id
        and membership.is_active;

      if (new.classification = 'CLASS_D_SENSITIVE_WELLBEING'
          and v_assignee_role is distinct from 'WELLBEING_PROFESSIONAL')
        or
         (new.classification = 'CLASS_F_SAFEGUARDING'
          and v_assignee_role is distinct from 'SAFEGUARDING_OFFICER') then
        raise exception 'SWEEP_INVALID_REFERRAL_ASSIGNEE: assignee is not authorized for this record class'
          using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create function private.sweep_protect_case_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.tenant_id is distinct from new.tenant_id
    or old.participant_id is distinct from new.participant_id
    or old.classification is distinct from new.classification
    or old.opened_by_id is distinct from new.opened_by_id
    or old.created_at is distinct from new.created_at then
    raise exception 'SWEEP_IMMUTABLE_CASE_IDENTITY: tenant, participant, class, creator and creation time cannot change'
      using errcode = '55000';
  end if;
  return new;
end;
$$;

create function private.sweep_protect_referral_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.tenant_id is distinct from new.tenant_id
    or old.case_id is distinct from new.case_id
    or old.participant_id is distinct from new.participant_id
    or old.referred_by_id is distinct from new.referred_by_id
    or old.classification is distinct from new.classification
    or old.created_at is distinct from new.created_at then
    raise exception 'SWEEP_IMMUTABLE_REFERRAL_IDENTITY: ownership and creation details cannot change'
      using errcode = '55000';
  end if;
  return new;
end;
$$;

-- State transitions are enforced in the database as well as the API. This
-- prevents a direct Data API caller from reopening a closed case or moving a
-- referral out of a terminal state.
create function private.sweep_validate_case_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and not (
    (old.status = 'OPEN' and new.status in ('IN_REVIEW', 'ACTIVE_SUPPORT', 'ESCALATED', 'CLOSED'))
    or (old.status = 'IN_REVIEW' and new.status in ('ACTIVE_SUPPORT', 'REFERRED', 'ESCALATED', 'CLOSED'))
    or (old.status = 'ACTIVE_SUPPORT' and new.status in ('REFERRED', 'ESCALATED', 'RESOLVED', 'CLOSED'))
    or (old.status = 'REFERRED' and new.status in ('ACTIVE_SUPPORT', 'ESCALATED', 'RESOLVED', 'CLOSED'))
    or (old.status = 'ESCALATED' and new.status in ('ACTIVE_SUPPORT', 'RESOLVED', 'CLOSED'))
    or (old.status = 'RESOLVED' and new.status = 'CLOSED')
  ) then
    raise exception 'SWEEP_INVALID_CASE_TRANSITION: the requested case status transition is not permitted'
      using errcode = '23514';
  end if;

  if new.status = 'CLOSED' then
    if old.status = 'CLOSED' and new.closed_at is distinct from old.closed_at then
      raise exception 'SWEEP_IMMUTABLE_CASE_CLOSURE: a case closure timestamp cannot change'
        using errcode = '55000';
    end if;
    if old.status <> 'CLOSED' then
      new.closed_at := now();
    end if;
  else
    new.closed_at := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create function private.sweep_validate_referral_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and not (
    (old.status = 'PENDING_REVIEW' and new.status in ('ASSIGNED', 'IN_PROGRESS', 'REFERRED_EXTERNAL', 'DECLINED', 'CANCELLED'))
    or (old.status = 'ASSIGNED' and new.status in ('IN_PROGRESS', 'REFERRED_EXTERNAL', 'DECLINED', 'CANCELLED'))
    or (old.status = 'IN_PROGRESS' and new.status in ('REFERRED_EXTERNAL', 'COMPLETED', 'DECLINED', 'CANCELLED'))
    or (old.status = 'REFERRED_EXTERNAL' and new.status in ('COMPLETED', 'DECLINED', 'CANCELLED'))
  ) then
    raise exception 'SWEEP_INVALID_REFERRAL_TRANSITION: the requested referral status transition is not permitted'
      using errcode = '23514';
  end if;

  if new.status = 'COMPLETED' then
    if old.status = 'COMPLETED' and new.completed_at is distinct from old.completed_at then
      raise exception 'SWEEP_IMMUTABLE_REFERRAL_COMPLETION: a referral completion timestamp cannot change'
        using errcode = '55000';
    end if;
    if old.status <> 'COMPLETED' then
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- Never store sensitive narrative text in audit metadata. The event confirms
-- access or mutation without duplicating the confidential content.
create function private.sweep_audit_case_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_action text;
  v_resource_type text;
  v_details jsonb;
begin
  if tg_table_name = 'sweep_cases' then
    v_actor_id := new.opened_by_id;
    v_action := case when tg_op = 'INSERT' then 'CASE_CREATED' else 'CASE_UPDATED' end;
    v_resource_type := 'case';
    v_details := jsonb_build_object('status', new.status, 'priority', new.priority);
  elsif tg_table_name = 'sweep_case_notes' then
    v_actor_id := new.author_id;
    v_action := 'CASE_NOTE_ADDED';
    v_resource_type := 'case_note';
    v_details := jsonb_build_object('case_id', new.case_id);
  elsif tg_table_name = 'sweep_referrals' then
    v_actor_id := new.referred_by_id;
    v_action := case when tg_op = 'INSERT' then 'REFERRAL_CREATED' else 'REFERRAL_UPDATED' end;
    v_resource_type := 'referral';
    v_details := jsonb_build_object('case_id', new.case_id, 'status', new.status, 'type', new.type);
  end if;

  insert into public.sweep_audit_events (
    tenant_id, actor_id, action, classification, resource_type, resource_id, details
  ) values (
    new.tenant_id,
    coalesce((select auth.uid()), v_actor_id),
    v_action,
    new.classification,
    v_resource_type,
    new.id::text,
    v_details
  );
  return new;
end;
$$;

-- SELECT cannot invoke a trigger. This reviewed RPC records a read only after
-- it rechecks the same tenant-and-class predicate used by the RLS policies.
create function public.sweep_record_case_read(p_case_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requested_count integer;
  v_accessible_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'SWEEP_AUTH_REQUIRED: sign in before accessing case records'
      using errcode = '28000';
  end if;

  v_requested_count := coalesce(array_length(p_case_ids, 1), 0);
  if v_requested_count = 0 then
    return;
  end if;

  select count(*) into v_accessible_count
  from public.sweep_cases case_record
  where case_record.id = any(p_case_ids)
    and private.sweep_can_access_case(case_record.tenant_id, case_record.classification);

  if v_accessible_count <> v_requested_count then
    raise exception 'SWEEP_CASE_ACCESS_DENIED: one or more requested cases are outside your authorized scope'
      using errcode = '42501';
  end if;

  insert into public.sweep_audit_events (
    tenant_id, actor_id, action, classification, resource_type, resource_id, details
  )
  select
    case_record.tenant_id,
    (select auth.uid()),
    'CASE_READ',
    case_record.classification,
    'case',
    case_record.id::text,
    jsonb_build_object('access_path', 'professional_workflow')
  from public.sweep_cases case_record
  where case_record.id = any(p_case_ids)
    and private.sweep_can_access_case(case_record.tenant_id, case_record.classification);
end;
$$;

revoke all on function private.sweep_can_access_case(uuid, text) from public, anon;
revoke all on function private.sweep_validate_case_relationship() from public, anon, authenticated;
revoke all on function private.sweep_protect_case_identity() from public, anon, authenticated;
revoke all on function private.sweep_protect_referral_identity() from public, anon, authenticated;
revoke all on function private.sweep_validate_case_transition() from public, anon, authenticated;
revoke all on function private.sweep_validate_referral_transition() from public, anon, authenticated;
revoke all on function private.sweep_audit_case_event() from public, anon, authenticated;
revoke all on function public.sweep_record_case_read(uuid[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.sweep_can_access_case(uuid, text) to authenticated;
grant execute on function public.sweep_record_case_read(uuid[]) to authenticated;

create trigger sweep_cases_validate_relationship
  before insert or update on public.sweep_cases
  for each row execute function private.sweep_validate_case_relationship();

create trigger sweep_cases_protect_identity
  before update on public.sweep_cases
  for each row execute function private.sweep_protect_case_identity();

create trigger sweep_cases_validate_transition
  before update on public.sweep_cases
  for each row execute function private.sweep_validate_case_transition();

create trigger sweep_case_notes_validate_relationship
  before insert on public.sweep_case_notes
  for each row execute function private.sweep_validate_case_relationship();

create trigger sweep_referrals_validate_relationship
  before insert or update on public.sweep_referrals
  for each row execute function private.sweep_validate_case_relationship();

create trigger sweep_referrals_protect_identity
  before update on public.sweep_referrals
  for each row execute function private.sweep_protect_referral_identity();

create trigger sweep_referrals_validate_transition
  before update on public.sweep_referrals
  for each row execute function private.sweep_validate_referral_transition();

create trigger sweep_cases_prevent_delete
  before delete on public.sweep_cases
  for each row execute function private.sweep_reject_immutable_row();

create trigger sweep_case_notes_immutable
  before update or delete on public.sweep_case_notes
  for each row execute function private.sweep_reject_immutable_row();

create trigger sweep_referrals_prevent_delete
  before delete on public.sweep_referrals
  for each row execute function private.sweep_reject_immutable_row();

create trigger sweep_cases_audit
  after insert or update on public.sweep_cases
  for each row execute function private.sweep_audit_case_event();

create trigger sweep_case_notes_audit
  after insert on public.sweep_case_notes
  for each row execute function private.sweep_audit_case_event();

create trigger sweep_referrals_audit
  after insert or update on public.sweep_referrals
  for each row execute function private.sweep_audit_case_event();

alter table public.sweep_cases enable row level security;
alter table public.sweep_case_notes enable row level security;
alter table public.sweep_referrals enable row level security;

alter table public.sweep_cases force row level security;
alter table public.sweep_case_notes force row level security;
alter table public.sweep_referrals force row level security;

revoke all on public.sweep_cases, public.sweep_case_notes, public.sweep_referrals from public, anon;
grant select, insert, update on public.sweep_cases to authenticated;
grant select, insert on public.sweep_case_notes to authenticated;
grant select, insert, update on public.sweep_referrals to authenticated;

create policy sweep_cases_select_authorized_staff
  on public.sweep_cases for select to authenticated
  using (private.sweep_can_access_case(tenant_id, classification));

create policy sweep_cases_insert_authorized_staff
  on public.sweep_cases for insert to authenticated
  with check (
    opened_by_id = (select auth.uid())
    and private.sweep_can_access_case(tenant_id, classification)
  );

create policy sweep_cases_update_authorized_staff
  on public.sweep_cases for update to authenticated
  using (private.sweep_can_access_case(tenant_id, classification))
  with check (private.sweep_can_access_case(tenant_id, classification));

create policy sweep_case_notes_select_authorized_staff
  on public.sweep_case_notes for select to authenticated
  using (private.sweep_can_access_case(tenant_id, classification));

create policy sweep_case_notes_insert_authorized_staff
  on public.sweep_case_notes for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and private.sweep_can_access_case(tenant_id, classification)
  );

create policy sweep_referrals_select_authorized_staff
  on public.sweep_referrals for select to authenticated
  using (private.sweep_can_access_case(tenant_id, classification));

create policy sweep_referrals_insert_authorized_staff
  on public.sweep_referrals for insert to authenticated
  with check (
    referred_by_id = (select auth.uid())
    and private.sweep_can_access_case(tenant_id, classification)
  );

create policy sweep_referrals_update_authorized_staff
  on public.sweep_referrals for update to authenticated
  using (private.sweep_can_access_case(tenant_id, classification))
  with check (private.sweep_can_access_case(tenant_id, classification));
