-- Connected participant workflows. Every privileged operation rechecks auth.uid()
-- and active tenant membership; public RPCs are SECURITY INVOKER wrappers.
alter table public.sweep_profiles add column locale text not null default 'en' check (locale in ('en','fr','es'));
alter table public.sweep_profiles add column adult_confirmed boolean not null default false;

create function private.sweep_has_role(p_tenant uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from public.sweep_memberships
    where tenant_id=p_tenant and user_id=(select auth.uid()) and is_active and role=any(p_roles));
$$;
revoke all on function private.sweep_has_role(uuid,text[]) from public,anon;
grant execute on function private.sweep_has_role(uuid,text[]) to authenticated;

create table public.sweep_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.sweep_tenants(id),
  email text not null check(email=lower(trim(email)) and email like '%@%'),
  role text not null check(role in ('ORG_ADMIN','WELLBEING_PROFESSIONAL','HR_MANAGER','TRAINER_FACILITATOR','PARTICIPANT','SAFEGUARDING_OFFICER')),
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null default now()+interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index sweep_invitations_tenant_idx on public.sweep_invitations(tenant_id,created_at desc);
create index sweep_invitations_email_idx on public.sweep_invitations(email,expires_at) where accepted_at is null;
alter table public.sweep_invitations enable row level security;
alter table public.sweep_invitations force row level security;
revoke all on public.sweep_invitations from public,anon,authenticated;
grant select on public.sweep_invitations to authenticated;
create policy sweep_invitations_admin_read on public.sweep_invitations for select to authenticated
using(private.sweep_has_role(tenant_id,array['ORG_ADMIN']));

create function private.sweep_invite(p_tenant uuid,p_email text,p_role text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if not private.sweep_has_role(p_tenant,array['ORG_ADMIN']) then raise exception 'Administrator access required' using errcode='42501'; end if;
  insert into public.sweep_invitations(tenant_id,email,role,invited_by)
  values(p_tenant,lower(trim(p_email)),p_role,auth.uid()) returning id into v_id;
  insert into public.sweep_audit_events(tenant_id,actor_id,action,classification,resource_type,resource_id,details)
  values(p_tenant,auth.uid(),'INVITATION_CREATED','CLASS_C_PERSONAL','invitation',v_id::text,jsonb_build_object('role',p_role));
  return v_id;
end; $$;
create function public.sweep_invite(p_tenant uuid,p_email text,p_role text)
returns uuid language sql security invoker set search_path='' as $$ select private.sweep_invite(p_tenant,p_email,p_role); $$;

create function private.sweep_accept_invitations()
returns integer language plpgsql security definer set search_path='' as $$
declare v_email text; v_inv record; v_count integer:=0;
begin
  select lower(email) into v_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if v_email is null then raise exception 'A verified email is required' using errcode='42501'; end if;
  for v_inv in select * from public.sweep_invitations where email=v_email and accepted_at is null and expires_at>now() order by created_at for update loop
    -- Existing memberships are never silently elevated by an invitation.
    insert into public.sweep_memberships(tenant_id,user_id,role) values(v_inv.tenant_id,auth.uid(),v_inv.role) on conflict(tenant_id,user_id) do nothing;
    update public.sweep_invitations set accepted_at=now() where id=v_inv.id;
    insert into public.sweep_audit_events(tenant_id,actor_id,action,classification,resource_type,resource_id)
    values(v_inv.tenant_id,auth.uid(),'INVITATION_ACCEPTED','CLASS_C_PERSONAL','invitation',v_inv.id::text);
    v_count:=v_count+1;
  end loop;
  return v_count;
end; $$;
create function public.sweep_accept_invitations() returns integer language sql security invoker set search_path='' as $$ select private.sweep_accept_invitations(); $$;

create function private.sweep_manage_member(p_tenant uuid,p_user uuid,p_role text,p_active boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_old text;
begin
  perform pg_advisory_xact_lock(hashtext(p_tenant::text));
  if not private.sweep_has_role(p_tenant,array['ORG_ADMIN']) then raise exception 'Administrator access required' using errcode='42501'; end if;
  if p_role not in ('ORG_ADMIN','WELLBEING_PROFESSIONAL','HR_MANAGER','TRAINER_FACILITATOR','PARTICIPANT','SAFEGUARDING_OFFICER') then raise exception 'Invalid role'; end if;
  select role into v_old from public.sweep_memberships where tenant_id=p_tenant and user_id=p_user for update;
  if not found then raise exception 'Member not found'; end if;
  if v_old='ORG_ADMIN' and (p_role<>'ORG_ADMIN' or not p_active) and
    (select count(*) from public.sweep_memberships where tenant_id=p_tenant and role='ORG_ADMIN' and is_active)<=1 then
    raise exception 'The last administrator cannot be removed';
  end if;
  update public.sweep_memberships set role=p_role,is_active=p_active,updated_at=now() where tenant_id=p_tenant and user_id=p_user;
  insert into public.sweep_audit_events(tenant_id,actor_id,action,classification,resource_type,resource_id,details)
  values(p_tenant,auth.uid(),'MEMBERSHIP_UPDATED','CLASS_C_PERSONAL','membership',p_user::text,jsonb_build_object('role',p_role,'active',p_active));
end; $$;
create function public.sweep_manage_member(p_tenant uuid,p_user uuid,p_role text,p_active boolean)
returns void language sql security invoker set search_path='' as $$ select private.sweep_manage_member(p_tenant,p_user,p_role,p_active); $$;

-- A separate directory contains identity only, never participant health data.
create function private.sweep_directory(p_tenant uuid)
returns table(user_id uuid,email text,full_name text,role text,is_active boolean)
language plpgsql security definer set search_path='' as $$
begin
  if not private.sweep_has_role(p_tenant,array['ORG_ADMIN']) then raise exception 'Administrator access required' using errcode='42501'; end if;
  return query select m.user_id,u.email::text,p.full_name,m.role,m.is_active from public.sweep_memberships m
    join auth.users u on u.id=m.user_id left join public.sweep_profiles p on p.id=m.user_id where m.tenant_id=p_tenant;
end; $$;
create function public.sweep_directory(p_tenant uuid)
returns table(user_id uuid,email text,full_name text,role text,is_active boolean)
language sql security invoker set search_path='' as $$ select * from private.sweep_directory(p_tenant); $$;

create table public.sweep_assessment_drafts (
  tenant_id uuid not null,
  campaign_id uuid not null,
  participant_id uuid not null,
  responses jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key(campaign_id,participant_id),
  foreign key(campaign_id,tenant_id) references public.sweep_campaigns(id,tenant_id),
  foreign key(tenant_id,participant_id) references public.sweep_memberships(tenant_id,user_id)
);
create index sweep_drafts_participant_idx on public.sweep_assessment_drafts(participant_id,tenant_id);
alter table public.sweep_assessment_drafts enable row level security;
alter table public.sweep_assessment_drafts force row level security;
revoke all on public.sweep_assessment_drafts from public,anon,authenticated;
grant select,insert,update,delete on public.sweep_assessment_drafts to authenticated;
create policy sweep_drafts_own on public.sweep_assessment_drafts for all to authenticated
using(participant_id=(select auth.uid()) and private.sweep_has_role(tenant_id,array['PARTICIPANT']))
with check(participant_id=(select auth.uid()) and private.sweep_has_role(tenant_id,array['PARTICIPANT'])
and not exists(select 1 from public.sweep_assessment_submissions s where s.campaign_id=sweep_assessment_drafts.campaign_id and s.participant_id=auth.uid())
and exists(select 1 from public.sweep_campaigns c where c.id=sweep_assessment_drafts.campaign_id and c.tenant_id=sweep_assessment_drafts.tenant_id and c.status='ACTIVE' and not c.is_anonymous and now()>=c.opens_at and now()<c.closes_at)
and exists(select 1 from public.sweep_consents c where c.id=(select id from public.sweep_consents where tenant_id=sweep_assessment_drafts.tenant_id and participant_id=auth.uid() and category='CORE_ASSESSMENT' order by recorded_at desc,id desc limit 1) and c.granted));

-- Atomically publish staff-authored content and its campaign. No clinical seed.
create function private.sweep_publish_checkin(p_tenant uuid,p_title text,p_description text,p_questions jsonb,p_rules jsonb,p_closes timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_assessment uuid; v_version uuid; v_campaign uuid; v_q jsonb; v_rule jsonb;
begin
  if not private.sweep_has_role(p_tenant,array['ORG_ADMIN','WELLBEING_PROFESSIONAL']) then raise exception 'Author access required' using errcode='42501'; end if;
  if char_length(trim(p_title)) not between 2 and 160 or p_closes<=now() or jsonb_typeof(p_questions)<>'array' or jsonb_array_length(p_questions) not between 1 and 50 or jsonb_array_length(p_rules)<>jsonb_array_length(p_questions) then raise exception 'Invalid assessment definition'; end if;
  if (select count(distinct q->>'id') from jsonb_array_elements(p_questions) q)<>jsonb_array_length(p_questions) then raise exception 'Duplicate question IDs'; end if;
  for v_q in select * from jsonb_array_elements(p_questions) loop
    if coalesce(length(trim(v_q->>'label')),0) not between 2 and 500 or coalesce(length(v_q->>'id'),0)=0 then raise exception 'Invalid question'; end if;
    select value into v_rule from jsonb_array_elements(p_rules) where value->>'questionId'=v_q->>'id';
    if v_rule is null or (v_rule->>'minScaleVal')::numeric is distinct from (v_q->>'min')::numeric or (v_rule->>'maxScaleVal')::numeric is distinct from (v_q->>'max')::numeric or (v_q->>'min')::integer>=(v_q->>'max')::integer or (v_q->>'max')::integer-(v_q->>'min')::integer>10 then raise exception 'Invalid scoring scale'; end if;
  end loop;
  insert into public.sweep_assessments(tenant_id,title,description,status,created_by_id)
    values(p_tenant,trim(p_title),p_description,'PUBLISHED',auth.uid()) returning id into v_assessment;
  insert into public.sweep_assessment_versions(tenant_id,assessment_id,version,definition,scoring_rules,published_at,created_by_id)
    values(p_tenant,v_assessment,1,jsonb_build_object('questions',p_questions,'scoringAlgorithmVersion','standard-norm-v1.0.0'),p_rules,now(),auth.uid()) returning id into v_version;
  insert into public.sweep_campaigns(tenant_id,assessment_version_id,title,opens_at,closes_at,status,created_by_id)
    values(p_tenant,v_version,trim(p_title),now(),p_closes,'ACTIVE',auth.uid()) returning id into v_campaign;
  insert into public.sweep_audit_events(tenant_id,actor_id,action,classification,resource_type,resource_id)
    values(p_tenant,auth.uid(),'CAMPAIGN_PUBLISHED','CLASS_B_ORGANIZATIONAL','campaign',v_campaign::text);
  return v_campaign;
end; $$;
create function public.sweep_publish_checkin(p_tenant uuid,p_title text,p_description text,p_questions jsonb,p_rules jsonb,p_closes timestamptz)
returns uuid language sql security invoker set search_path='' as $$ select private.sweep_publish_checkin(p_tenant,p_title,p_description,p_questions,p_rules,p_closes); $$;

-- Calculate in PostgreSQL, inside the same transaction as consent and campaign
-- checks. Clients cannot supply their own scores or participant identifiers.
create function private.sweep_submit_checkin(p_campaign uuid,p_responses jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_c public.sweep_campaigns; v_v public.sweep_assessment_versions; v_rule jsonb; v_answer numeric; v_min numeric; v_max numeric; v_weight numeric; v_value numeric;
v_domains jsonb:='{}'; v_scores jsonb:='{}'; v_domain text; v_acc jsonb; v_norm numeric; v_overall numeric:=0; v_count integer:=0; v_snapshot jsonb; v_id uuid; v_at timestamptz:=now();
begin
  select * into v_c from public.sweep_campaigns where id=p_campaign for share;
  if not found or not private.sweep_has_role(v_c.tenant_id,array['PARTICIPANT']) then raise exception 'Campaign unavailable' using errcode='42501'; end if;
  if v_c.is_anonymous or v_c.targeting<>'{}'::jsonb then raise exception 'This campaign mode is not available'; end if;
  if v_c.status<>'ACTIVE' or v_at<v_c.opens_at or v_at>=v_c.closes_at then raise exception 'Campaign is closed' using errcode='23514'; end if;
  if not exists(select 1 from public.sweep_profiles where id=auth.uid() and adult_confirmed) then raise exception 'Adult participant setup is required' using errcode='42501'; end if;
  -- Serialize consent changes and submissions for the same participant.
  perform pg_advisory_xact_lock(hashtext(v_c.tenant_id::text||auth.uid()::text));
  if not coalesce((select granted from public.sweep_consents where tenant_id=v_c.tenant_id and participant_id=auth.uid() and category='CORE_ASSESSMENT' order by recorded_at desc,id desc limit 1),false) then raise exception 'Current consent is required' using errcode='42501'; end if;
  select * into v_v from public.sweep_assessment_versions where id=v_c.assessment_version_id and tenant_id=v_c.tenant_id and published_at is not null;
  if not found then raise exception 'Published instrument unavailable'; end if;
  if jsonb_typeof(p_responses)<>'object' or (select count(*) from jsonb_object_keys(p_responses))<>jsonb_array_length(v_v.scoring_rules) then raise exception 'Answer every configured question'; end if;
  for v_rule in select * from jsonb_array_elements(v_v.scoring_rules) loop
    if jsonb_typeof(p_responses->(v_rule->>'questionId')) is distinct from 'number' then raise exception 'Invalid answer'; end if;
    v_answer:=(p_responses->>(v_rule->>'questionId'))::numeric;
    v_min:=coalesce((v_rule->>'minScaleVal')::numeric,1); v_max:=coalesce((v_rule->>'maxScaleVal')::numeric,5); v_weight:=coalesce((v_rule->>'weight')::numeric,1);
    if v_answer<>trunc(v_answer) or v_answer<v_min or v_answer>v_max or v_min>=v_max or v_weight<=0 then raise exception 'Answer outside configured scale'; end if;
    v_value:=case when coalesce((v_rule->>'reverseScore')::boolean,false) then v_max-(v_answer-v_min) else v_answer end;
    v_domain:=v_rule->>'domainId'; v_acc:=coalesce(v_domains->v_domain,'{"sum":0,"max":0,"count":0}'::jsonb);
    v_domains:=jsonb_set(v_domains,array[v_domain],jsonb_build_object('sum',(v_acc->>'sum')::numeric+v_value*v_weight,'max',(v_acc->>'max')::numeric+v_max*v_weight,'count',(v_acc->>'count')::integer+1));
  end loop;
  for v_domain,v_acc in select * from jsonb_each(v_domains) loop
    v_norm:=round((v_acc->>'sum')::numeric/(v_acc->>'max')::numeric*100,1); v_overall:=v_overall+v_norm; v_count:=v_count+1;
    v_scores:=jsonb_set(v_scores,array[v_domain],jsonb_build_object('domainId',v_domain,'rawScore',round((v_acc->>'sum')::numeric,1),'maxPossibleScore',(v_acc->>'max')::numeric,'normalizedScore',v_norm,'itemsAnswered',(v_acc->>'count')::integer,'totalItems',(v_acc->>'count')::integer));
  end loop;
  v_snapshot:=jsonb_build_object('assessmentVersionId',v_v.id,'scoringAlgorithmVersion','standard-norm-v1.0.0','domainScores',v_scores,'overallIndex',round(v_overall/v_count,1),'computedAt',v_at);
  insert into public.sweep_assessment_submissions(tenant_id,campaign_id,assessment_version_id,participant_id,responses,score_snapshot)
    values(v_c.tenant_id,v_c.id,v_v.id,auth.uid(),p_responses,v_snapshot) returning id into v_id;
  delete from public.sweep_assessment_drafts where campaign_id=v_c.id and participant_id=auth.uid();
  return jsonb_build_object('submissionId',v_id,'submittedAt',v_at,'score',v_snapshot->'overallIndex','domainScores',v_scores);
end; $$;
create function public.sweep_submit_checkin(p_campaign uuid,p_responses jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select private.sweep_submit_checkin(p_campaign,p_responses); $$;

-- Serialize consent writes with submission, and remove drafts on withdrawal.
create function private.sweep_consent_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.tenant_id::text||new.participant_id::text));
  new.recorded_at:=clock_timestamp();
  if new.category='CORE_ASSESSMENT' and not new.granted then delete from public.sweep_assessment_drafts where tenant_id=new.tenant_id and participant_id=new.participant_id; end if;
  return new;
end; $$;
revoke all on function private.sweep_consent_event() from public,anon,authenticated;
create trigger sweep_consent_serialize before insert on public.sweep_consents for each row execute function private.sweep_consent_event();

-- Publish wrappers explicitly; no default public EXECUTE on privileged helpers.
revoke all on function private.sweep_invite(uuid,text,text),private.sweep_accept_invitations(),private.sweep_manage_member(uuid,uuid,text,boolean),private.sweep_directory(uuid),private.sweep_publish_checkin(uuid,text,text,jsonb,jsonb,timestamptz),private.sweep_submit_checkin(uuid,jsonb) from public,anon;
revoke all on function public.sweep_invite(uuid,text,text),public.sweep_accept_invitations(),public.sweep_manage_member(uuid,uuid,text,boolean),public.sweep_directory(uuid),public.sweep_publish_checkin(uuid,text,text,jsonb,jsonb,timestamptz),public.sweep_submit_checkin(uuid,jsonb) from public,anon;
grant execute on function private.sweep_invite(uuid,text,text),private.sweep_accept_invitations(),private.sweep_manage_member(uuid,uuid,text,boolean),private.sweep_directory(uuid),private.sweep_publish_checkin(uuid,text,text,jsonb,jsonb,timestamptz),private.sweep_submit_checkin(uuid,jsonb) to authenticated;
grant execute on function public.sweep_invite(uuid,text,text),public.sweep_accept_invitations(),public.sweep_manage_member(uuid,uuid,text,boolean),public.sweep_directory(uuid),public.sweep_publish_checkin(uuid,text,text,jsonb,jsonb,timestamptz),public.sweep_submit_checkin(uuid,jsonb) to authenticated;

create table public.sweep_knowledge_resources (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.sweep_tenants(id),
  title text not null check(length(title) between 2 and 200),
  url text not null check(url like 'https://%'),
  excerpt text not null check(length(excerpt) between 10 and 6000),
  tags text not null check(length(tags) between 2 and 500),
  approved_by uuid not null references auth.users(id), approved_at timestamptz not null default now(),
  unique(id,tenant_id)
);
create index sweep_resources_tenant_idx on public.sweep_knowledge_resources(tenant_id);
alter table public.sweep_knowledge_resources enable row level security;
alter table public.sweep_knowledge_resources force row level security;
revoke all on public.sweep_knowledge_resources from public,anon,authenticated;
grant select,insert on public.sweep_knowledge_resources to authenticated;
create policy sweep_resources_read on public.sweep_knowledge_resources for select to authenticated
using(private.sweep_has_role(tenant_id,array['PARTICIPANT','ORG_ADMIN','WELLBEING_PROFESSIONAL','TRAINER_FACILITATOR','SAFEGUARDING_OFFICER','HR_MANAGER']));
create policy sweep_resources_approve on public.sweep_knowledge_resources for insert to authenticated
with check(approved_by=(select auth.uid()) and private.sweep_has_role(tenant_id,array['ORG_ADMIN','WELLBEING_PROFESSIONAL']));
create table public.sweep_assistant_events (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.sweep_tenants(id),
  user_id uuid not null references auth.users(id), mode text not null check(mode in ('RETRIEVED','REFUSED','SAFETY')),
  source_ids uuid[] not null default '{}', output_hash text not null,
  model_version text not null default 'retrieval-only-v1',prompt_version text not null default 'resource-navigation-v1',
  created_at timestamptz not null default now()
);
create index sweep_assistant_events_user_idx on public.sweep_assistant_events(user_id,tenant_id);
alter table public.sweep_assistant_events enable row level security;
alter table public.sweep_assistant_events force row level security;
revoke all on public.sweep_assistant_events from public,anon,authenticated;
grant insert on public.sweep_assistant_events to authenticated;
create policy sweep_assistant_event_insert on public.sweep_assistant_events for insert to authenticated
with check(user_id=(select auth.uid()) and private.sweep_has_role(tenant_id,array['PARTICIPANT']));
create trigger sweep_assistant_events_immutable before update or delete on public.sweep_assistant_events for each row execute function private.sweep_reject_immutable_row();

create table public.sweep_delivery_sessions (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.sweep_tenants(id),
  title text not null check(length(title) between 2 and 200), materials text not null check(length(materials)<=12000),
  facilitator_id uuid not null, scheduled_at timestamptz not null,
  status text not null default 'DRAFT' check(status in ('DRAFT','APPROVED','COMPLETED')),
  approved_by uuid references auth.users(id),created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),unique(id,tenant_id),
  foreign key(tenant_id,facilitator_id) references public.sweep_memberships(tenant_id,user_id)
);
create index sweep_delivery_tenant_idx on public.sweep_delivery_sessions(tenant_id,scheduled_at);
create index sweep_delivery_facilitator_idx on public.sweep_delivery_sessions(facilitator_id,tenant_id);
create table public.sweep_session_enrollments (
  session_id uuid not null,tenant_id uuid not null,participant_id uuid not null,
  attended boolean not null default false,updated_at timestamptz not null default now(),
  primary key(session_id,participant_id),
  foreign key(session_id,tenant_id) references public.sweep_delivery_sessions(id,tenant_id),
  foreign key(tenant_id,participant_id) references public.sweep_memberships(tenant_id,user_id)
);
create index sweep_enrollment_participant_idx on public.sweep_session_enrollments(participant_id,tenant_id);
alter table public.sweep_delivery_sessions enable row level security;
alter table public.sweep_delivery_sessions force row level security;
alter table public.sweep_session_enrollments enable row level security;
alter table public.sweep_session_enrollments force row level security;
revoke all on public.sweep_delivery_sessions,public.sweep_session_enrollments from public,anon,authenticated;
grant select on public.sweep_delivery_sessions,public.sweep_session_enrollments to authenticated;
create policy sweep_sessions_staff_read on public.sweep_delivery_sessions for select to authenticated using(
  private.sweep_has_role(tenant_id,array['ORG_ADMIN','WELLBEING_PROFESSIONAL']) or
  (facilitator_id=(select auth.uid()) and private.sweep_has_role(tenant_id,array['TRAINER_FACILITATOR']) and status<>'DRAFT'));
create policy sweep_enrollments_read on public.sweep_session_enrollments for select to authenticated using(
  (participant_id=(select auth.uid()) and private.sweep_has_role(tenant_id,array['PARTICIPANT'])) or
  private.sweep_has_role(tenant_id,array['ORG_ADMIN','WELLBEING_PROFESSIONAL']) or
  exists(select 1 from public.sweep_delivery_sessions s where s.id=session_id and s.facilitator_id=auth.uid() and s.status<>'DRAFT'));

create function private.sweep_session_command(p_tenant uuid,p_command text,p_data jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_session public.sweep_delivery_sessions; v_id uuid; v_facilitator uuid; v_participant uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_command='CREATE' then
    if not private.sweep_has_role(p_tenant,array['ORG_ADMIN']) then raise exception 'Administrator access required' using errcode='42501'; end if;
    v_facilitator:=(p_data->>'facilitatorId')::uuid;
    if not exists(select 1 from public.sweep_memberships where tenant_id=p_tenant and user_id=v_facilitator and role='TRAINER_FACILITATOR' and is_active) then raise exception 'Active facilitator required'; end if;
    insert into public.sweep_delivery_sessions(tenant_id,title,materials,facilitator_id,scheduled_at,created_by)
    values(p_tenant,p_data->>'title',p_data->>'materials',v_facilitator,(p_data->>'scheduledAt')::timestamptz,auth.uid()) returning id into v_id;
  else
    select * into v_session from public.sweep_delivery_sessions where id=(p_data->>'sessionId')::uuid and tenant_id=p_tenant for update;
    if not found then raise exception 'Session unavailable'; end if;
    v_id:=v_session.id;
    if p_command='APPROVE' then
      if not private.sweep_has_role(p_tenant,array['ORG_ADMIN','WELLBEING_PROFESSIONAL']) or v_session.status<>'DRAFT' then raise exception 'Review access and draft status required' using errcode='42501'; end if;
      update public.sweep_delivery_sessions set status='APPROVED',approved_by=auth.uid() where id=v_id;
    elsif p_command='ENROLL' then
      if not private.sweep_has_role(p_tenant,array['ORG_ADMIN']) or v_session.status='COMPLETED' then raise exception 'Enrollment unavailable' using errcode='42501'; end if;
      v_participant:=(p_data->>'participantId')::uuid;
      if not exists(select 1 from public.sweep_memberships where tenant_id=p_tenant and user_id=v_participant and role='PARTICIPANT' and is_active) then raise exception 'Active participant required'; end if;
      insert into public.sweep_session_enrollments(session_id,tenant_id,participant_id) values(v_id,p_tenant,v_participant) on conflict do nothing;
    elsif p_command in ('ATTENDANCE','COMPLETE') then
      if v_session.facilitator_id<>auth.uid() or not private.sweep_has_role(p_tenant,array['TRAINER_FACILITATOR']) or v_session.status<>'APPROVED' then raise exception 'Assigned facilitator and approved session required' using errcode='42501'; end if;
      if p_command='COMPLETE' then update public.sweep_delivery_sessions set status='COMPLETED' where id=v_id;
      else update public.sweep_session_enrollments set attended=(p_data->>'attended')::boolean,updated_at=now() where session_id=v_id and participant_id=(p_data->>'participantId')::uuid; if not found then raise exception 'Enrollment unavailable'; end if;
      end if;
    else raise exception 'Unknown session command'; end if;
  end if;
  insert into public.sweep_audit_events(tenant_id,actor_id,action,classification,resource_type,resource_id)
  values(p_tenant,auth.uid(),'SESSION_'||p_command,'CLASS_C_PERSONAL','delivery_session',v_id::text);
end; $$;
create function public.sweep_session_command(p_tenant uuid,p_command text,p_data jsonb) returns void language sql security invoker set search_path='' as $$ select private.sweep_session_command(p_tenant,p_command,p_data); $$;
revoke all on function private.sweep_session_command(uuid,text,jsonb),public.sweep_session_command(uuid,text,jsonb) from public,anon;
grant execute on function private.sweep_session_command(uuid,text,jsonb),public.sweep_session_command(uuid,text,jsonb) to authenticated;
