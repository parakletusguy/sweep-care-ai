-- SWEEP Care AI foundational persistence and access-control model.
--
-- All new tables are prefixed with sweep_ so that they remain isolated from
-- legacy editorial tables already present in this Supabase project.

create schema if not exists private;

create table public.sweep_tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sector text not null check (sector in ('corporate', 'school', 'church', 'training')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sweep_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sweep_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.sweep_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in (
    'SUPER_ADMIN', 'ORG_ADMIN', 'WELLBEING_PROFESSIONAL', 'HR_MANAGER',
    'TRAINER_FACILITATOR', 'PARTICIPANT', 'SAFEGUARDING_OFFICER'
  )),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table public.sweep_tenant_policies (
  tenant_id uuid primary key references public.sweep_tenants(id) on delete cascade,
  min_cohort_size integer not null default 10 check (min_cohort_size >= 10),
  retention_days_class_d integer not null default 365 check (retention_days_class_d > 0),
  require_guardian_under_age integer not null default 18
    check (require_guardian_under_age between 0 and 25),
  crisis_resources jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Consent decisions are an immutable event history. Revocation is a new row
-- with granted = false, never an update to a previous decision.
create table public.sweep_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.sweep_tenants(id) on delete restrict,
  participant_id uuid not null references auth.users(id) on delete restrict,
  category text not null check (category in (
    'CORE_ASSESSMENT', 'AGGREGATED_REPORTING', 'SAFEGUARDING_ESCALATION'
  )),
  granted boolean not null,
  policy_version text not null,
  recorded_at timestamptz not null default now()
);

create table public.sweep_assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.sweep_tenants(id) on delete restrict,
  title text not null,
  description text,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  validation_status text not null default 'ORGANIZATION_CUSTOM' check (validation_status in (
    'VERIFIED_EXTERNAL', 'UNVERIFIED', 'ORGANIZATION_CUSTOM'
  )),
  instrument_source text,
  created_by_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tenant_id)
);

create table public.sweep_assessment_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  assessment_id uuid not null,
  version integer not null check (version > 0),
  definition jsonb not null,
  scoring_rules jsonb not null,
  published_at timestamptz,
  created_by_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (assessment_id, version),
  unique (id, tenant_id),
  foreign key (assessment_id, tenant_id)
    references public.sweep_assessments(id, tenant_id) on delete restrict
);

create table public.sweep_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  assessment_version_id uuid not null,
  title text not null,
  targeting jsonb not null default '{}'::jsonb,
  is_anonymous boolean not null default false,
  min_cohort_size integer not null default 10 check (min_cohort_size >= 10),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'ACTIVE', 'CLOSED')),
  created_by_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (closes_at > opens_at),
  unique (id, tenant_id),
  foreign key (assessment_version_id, tenant_id)
    references public.sweep_assessment_versions(id, tenant_id) on delete restrict
);

-- Direct browser writes are intentionally not granted. A server-only route
-- calculates the deterministic score and writes an immutable submission.
create table public.sweep_assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  campaign_id uuid not null,
  assessment_version_id uuid not null,
  participant_id uuid not null,
  responses jsonb not null,
  score_snapshot jsonb not null,
  submitted_at timestamptz not null default now(),
  unique (campaign_id, participant_id),
  foreign key (campaign_id, tenant_id)
    references public.sweep_campaigns(id, tenant_id) on delete restrict,
  foreign key (assessment_version_id, tenant_id)
    references public.sweep_assessment_versions(id, tenant_id) on delete restrict,
  foreign key (tenant_id, participant_id)
    references public.sweep_memberships(tenant_id, user_id) on delete restrict
);

-- The legacy public.audit_events table is not used by SWEEP Care.
create table public.sweep_audit_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.sweep_tenants(id) on delete restrict,
  actor_id uuid,
  action text not null,
  classification text not null check (classification in (
    'CLASS_A_PUBLIC', 'CLASS_B_ORGANIZATIONAL', 'CLASS_C_PERSONAL',
    'CLASS_D_SENSITIVE_WELLBEING', 'CLASS_E_SENSITIVE_HEALTH', 'CLASS_F_SAFEGUARDING'
  )),
  resource_type text not null,
  resource_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index sweep_memberships_user_tenant_role_idx
  on public.sweep_memberships (user_id, tenant_id, role)
  where is_active;

create index sweep_consents_latest_idx
  on public.sweep_consents (tenant_id, participant_id, category, recorded_at desc);

create index sweep_assessments_tenant_status_idx
  on public.sweep_assessments (tenant_id, status, updated_at desc);

create index sweep_assessment_versions_tenant_assessment_idx
  on public.sweep_assessment_versions (tenant_id, assessment_id, version desc);

create index sweep_campaigns_tenant_status_window_idx
  on public.sweep_campaigns (tenant_id, status, opens_at, closes_at);

create index sweep_submissions_participant_tenant_idx
  on public.sweep_assessment_submissions (participant_id, tenant_id, submitted_at desc);

create index sweep_submissions_campaign_idx
  on public.sweep_assessment_submissions (campaign_id, submitted_at desc);

create index sweep_audit_events_tenant_created_idx
  on public.sweep_audit_events (tenant_id, created_at desc);

alter table public.sweep_tenants enable row level security;
alter table public.sweep_profiles enable row level security;
alter table public.sweep_memberships enable row level security;
alter table public.sweep_tenant_policies enable row level security;
alter table public.sweep_consents enable row level security;
alter table public.sweep_assessments enable row level security;
alter table public.sweep_assessment_versions enable row level security;
alter table public.sweep_campaigns enable row level security;
alter table public.sweep_assessment_submissions enable row level security;
alter table public.sweep_audit_events enable row level security;

alter table public.sweep_tenants force row level security;
alter table public.sweep_profiles force row level security;
alter table public.sweep_memberships force row level security;
alter table public.sweep_tenant_policies force row level security;
alter table public.sweep_consents force row level security;
alter table public.sweep_assessments force row level security;
alter table public.sweep_assessment_versions force row level security;
alter table public.sweep_campaigns force row level security;
alter table public.sweep_assessment_submissions force row level security;
alter table public.sweep_audit_events force row level security;

revoke all on schema private from public, anon, authenticated;
revoke all on public.sweep_tenants, public.sweep_profiles, public.sweep_memberships,
  public.sweep_tenant_policies, public.sweep_consents, public.sweep_assessments,
  public.sweep_assessment_versions, public.sweep_campaigns,
  public.sweep_assessment_submissions, public.sweep_audit_events
  from anon, authenticated;

grant select on public.sweep_tenants, public.sweep_profiles, public.sweep_memberships,
  public.sweep_tenant_policies, public.sweep_consents, public.sweep_assessments,
  public.sweep_assessment_versions, public.sweep_campaigns,
  public.sweep_assessment_submissions to authenticated;

grant insert on public.sweep_profiles, public.sweep_consents, public.sweep_assessments,
  public.sweep_assessment_versions, public.sweep_campaigns to authenticated;

grant update on public.sweep_profiles to authenticated;

create policy sweep_profiles_select_own
  on public.sweep_profiles for select to authenticated
  using (id = (select auth.uid()));

create policy sweep_profiles_insert_own
  on public.sweep_profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy sweep_profiles_update_own
  on public.sweep_profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy sweep_memberships_select_own
  on public.sweep_memberships for select to authenticated
  using (user_id = (select auth.uid()) and is_active);

create policy sweep_tenants_select_member
  on public.sweep_tenants for select to authenticated
  using (
    exists (
      select 1 from public.sweep_memberships membership
      where membership.tenant_id = sweep_tenants.id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );

create policy sweep_tenant_policies_select_member
  on public.sweep_tenant_policies for select to authenticated
  using (
    exists (
      select 1 from public.sweep_memberships membership
      where membership.tenant_id = sweep_tenant_policies.tenant_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );

create policy sweep_consents_select_own
  on public.sweep_consents for select to authenticated
  using (participant_id = (select auth.uid()));

create policy sweep_consents_insert_own_membership
  on public.sweep_consents for insert to authenticated
  with check (
    participant_id = (select auth.uid())
    and exists (
      select 1 from public.sweep_memberships membership
      where membership.tenant_id = sweep_consents.tenant_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );

create policy sweep_assessments_select_member
  on public.sweep_assessments for select to authenticated
  using (
    exists (
      select 1 from public.sweep_memberships membership
      where membership.tenant_id = sweep_assessments.tenant_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and (
          sweep_assessments.status = 'PUBLISHED'
          or membership.role in ('ORG_ADMIN', 'WELLBEING_PROFESSIONAL')
        )
    )
  );

create policy sweep_assessments_insert_author
  on public.sweep_assessments for insert to authenticated
  with check (
    created_by_id = (select auth.uid())
    and exists (
      select 1 from public.sweep_memberships membership
      where membership.tenant_id = sweep_assessments.tenant_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('ORG_ADMIN', 'WELLBEING_PROFESSIONAL')
    )
  );

create policy sweep_assessment_versions_select_member
  on public.sweep_assessment_versions for select to authenticated
  using (
    exists (
      select 1
      from public.sweep_assessments assessment
      join public.sweep_memberships membership
        on membership.tenant_id = assessment.tenant_id
      where assessment.id = sweep_assessment_versions.assessment_id
        and assessment.tenant_id = sweep_assessment_versions.tenant_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and (
          assessment.status = 'PUBLISHED'
          or membership.role in ('ORG_ADMIN', 'WELLBEING_PROFESSIONAL')
        )
    )
  );

create policy sweep_assessment_versions_insert_author
  on public.sweep_assessment_versions for insert to authenticated
  with check (
    created_by_id = (select auth.uid())
    and exists (
      select 1 from public.sweep_memberships membership
      where membership.tenant_id = sweep_assessment_versions.tenant_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('ORG_ADMIN', 'WELLBEING_PROFESSIONAL')
    )
  );

create policy sweep_campaigns_select_member
  on public.sweep_campaigns for select to authenticated
  using (
    exists (
      select 1 from public.sweep_memberships membership
      where membership.tenant_id = sweep_campaigns.tenant_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
    )
  );

create policy sweep_campaigns_insert_staff
  on public.sweep_campaigns for insert to authenticated
  with check (
    created_by_id = (select auth.uid())
    and exists (
      select 1 from public.sweep_memberships membership
      where membership.tenant_id = sweep_campaigns.tenant_id
        and membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('ORG_ADMIN', 'WELLBEING_PROFESSIONAL')
    )
  );

create policy sweep_submissions_select_own
  on public.sweep_assessment_submissions for select to authenticated
  using (participant_id = (select auth.uid()));

create or replace function private.sweep_reject_immutable_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'SWEEP_IMMUTABLE_RECORD: % records cannot be changed or deleted', tg_table_name
    using errcode = '55000';
  return null;
end;
$$;

create or replace function private.sweep_prevent_version_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.sweep_assessment_submissions submission
    where submission.assessment_version_id = old.id
  ) then
    raise exception 'SWEEP_IMMUTABLE_ASSESSMENT_VERSION: submitted assessment versions cannot be changed or deleted'
      using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function private.sweep_audit_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.sweep_audit_events (
    tenant_id,
    actor_id,
    action,
    classification,
    resource_type,
    resource_id,
    details
  ) values (
    new.tenant_id,
    coalesce((select auth.uid()), new.participant_id),
    'ASSESSMENT_SUBMITTED',
    'CLASS_D_SENSITIVE_WELLBEING',
    'assessment_submission',
    new.id::text,
    jsonb_build_object(
      'campaign_id', new.campaign_id,
      'assessment_version_id', new.assessment_version_id
    )
  );
  return new;
end;
$$;

revoke all on function private.sweep_reject_immutable_row() from public, anon, authenticated;
revoke all on function private.sweep_prevent_version_mutation() from public, anon, authenticated;
revoke all on function private.sweep_audit_submission() from public, anon, authenticated;

create trigger sweep_consents_immutable
  before update or delete on public.sweep_consents
  for each row execute function private.sweep_reject_immutable_row();

create trigger sweep_submissions_immutable
  before update or delete on public.sweep_assessment_submissions
  for each row execute function private.sweep_reject_immutable_row();

create trigger sweep_audit_events_immutable
  before update or delete on public.sweep_audit_events
  for each row execute function private.sweep_reject_immutable_row();

create trigger sweep_assessment_versions_immutable_after_submission
  before update or delete on public.sweep_assessment_versions
  for each row execute function private.sweep_prevent_version_mutation();

create trigger sweep_submission_audit
  after insert on public.sweep_assessment_submissions
  for each row execute function private.sweep_audit_submission();
