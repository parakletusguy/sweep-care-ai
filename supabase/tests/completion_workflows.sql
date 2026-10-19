-- Read/write integration tests with disposable records, always rolled back.
-- Run: supabase db query --linked --file supabase/tests/completion_workflows.sql
begin;
do $$
declare v_tenant uuid:=gen_random_uuid();v_other uuid:=gen_random_uuid();v_admin uuid:=gen_random_uuid();v_participant uuid:=gen_random_uuid();v_hr uuid:=gen_random_uuid();v_pro uuid:=gen_random_uuid();v_officer uuid:=gen_random_uuid();v_trainer uuid:=gen_random_uuid();v_outsider uuid:=gen_random_uuid();v_id uuid;
begin
  perform set_config('sweep_test.tenant',v_tenant::text,true);perform set_config('sweep_test.other',v_other::text,true);
  perform set_config('sweep_test.admin',v_admin::text,true);perform set_config('sweep_test.participant',v_participant::text,true);perform set_config('sweep_test.hr',v_hr::text,true);perform set_config('sweep_test.pro',v_pro::text,true);perform set_config('sweep_test.officer',v_officer::text,true);perform set_config('sweep_test.trainer',v_trainer::text,true);perform set_config('sweep_test.outsider',v_outsider::text,true);
  foreach v_id in array array[v_admin,v_participant,v_hr,v_pro,v_officer,v_trainer,v_outsider] loop
    insert into auth.users(id,email,email_confirmed_at) values(v_id,v_id::text||'@example.invalid',now());
  end loop;
  insert into public.sweep_tenants(id,slug,name,sector) values(v_tenant,'integration-'||v_tenant,'Integration test','corporate'),(v_other,'integration-'||v_other,'Isolation test','corporate');
  insert into public.sweep_memberships(tenant_id,user_id,role) values(v_tenant,v_admin,'ORG_ADMIN'),(v_tenant,v_participant,'PARTICIPANT'),(v_tenant,v_hr,'HR_MANAGER'),(v_tenant,v_pro,'WELLBEING_PROFESSIONAL'),(v_tenant,v_officer,'SAFEGUARDING_OFFICER'),(v_tenant,v_trainer,'TRAINER_FACILITATOR'),(v_other,v_outsider,'PARTICIPANT');
  insert into public.sweep_profiles(id,full_name,adult_confirmed) values(v_participant,'Integration participant',true);
  insert into public.sweep_cases(tenant_id,participant_id,title,description,opened_by_id,classification) values(v_tenant,v_participant,'Wellbeing test','Confidential record test',v_pro,'CLASS_D_SENSITIVE_WELLBEING'),(v_tenant,v_participant,'Safeguarding test','Restricted record test',v_officer,'CLASS_F_SAFEGUARDING');
end $$;

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.admin'),'role','authenticated')::text,true);
do $$declare v_campaign uuid;v_refused boolean:=false;
begin
  v_campaign:=public.sweep_publish_checkin(current_setting('sweep_test.tenant')::uuid,'Test instrument','Test only',
    '[{"id":"q1","label":"Question one","min":1,"max":5},{"id":"q2","label":"Question two","min":1,"max":5}]',
    '[{"questionId":"q1","domainId":"energy","minScaleVal":1,"maxScaleVal":5},{"questionId":"q2","domainId":"energy","minScaleVal":1,"maxScaleVal":5,"reverseScore":true}]',now()+interval '1 day');
  perform set_config('sweep_test.campaign',v_campaign::text,true);
  if (select count(*) from public.sweep_cases where tenant_id=current_setting('sweep_test.tenant')::uuid)<>0 then raise exception 'FAIL: administrator sees sensitive cases';end if;
  begin perform public.sweep_manage_member(current_setting('sweep_test.tenant')::uuid,auth.uid(),'PARTICIPANT',true);exception when others then v_refused:=true;end;
  if not v_refused then raise exception 'FAIL: last administrator demoted';end if;
end $$;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.participant'),'role','authenticated')::text,true);
do $$declare v_refused boolean:=false;v_result jsonb;
begin
  begin perform public.sweep_submit_checkin(current_setting('sweep_test.campaign')::uuid,'{"q1":4,"q2":2}');exception when insufficient_privilege then v_refused:=true;end;
  if not v_refused then raise exception 'FAIL: submission without consent';end if;
  insert into public.sweep_consents(tenant_id,participant_id,category,granted,policy_version) values(current_setting('sweep_test.tenant')::uuid,auth.uid(),'CORE_ASSESSMENT',true,'integration');
  insert into public.sweep_assessment_drafts(tenant_id,campaign_id,participant_id,responses) values(current_setting('sweep_test.tenant')::uuid,current_setting('sweep_test.campaign')::uuid,auth.uid(),'{"q1":4}');
  insert into public.sweep_consents(tenant_id,participant_id,category,granted,policy_version) values(current_setting('sweep_test.tenant')::uuid,auth.uid(),'CORE_ASSESSMENT',false,'integration');
  if exists(select 1 from public.sweep_assessment_drafts) then raise exception 'FAIL: draft survived consent withdrawal';end if;
  insert into public.sweep_consents(tenant_id,participant_id,category,granted,policy_version) values(current_setting('sweep_test.tenant')::uuid,auth.uid(),'CORE_ASSESSMENT',true,'integration');
  v_refused:=false;
  begin perform public.sweep_submit_checkin(current_setting('sweep_test.campaign')::uuid,'{"q1":9,"q2":2}');exception when others then v_refused:=true;end;
  if not v_refused then raise exception 'FAIL: invalid scale accepted';end if;
  v_result:=public.sweep_submit_checkin(current_setting('sweep_test.campaign')::uuid,'{"q1":4,"q2":2}');
  if (v_result->>'score')::numeric<>80 then raise exception 'FAIL: deterministic reversed score mismatch';end if;
  if (select count(*) from public.sweep_assessment_drafts)<>0 then raise exception 'FAIL: submitted draft retained';end if;
  v_refused:=false;
  begin perform public.sweep_submit_checkin(current_setting('sweep_test.campaign')::uuid,'{"q1":4,"q2":2}');exception when unique_violation then v_refused:=true;end;
  if not v_refused then raise exception 'FAIL: duplicate submission';end if;
  v_refused:=false;
  begin perform public.sweep_invite(current_setting('sweep_test.tenant')::uuid,'intruder@example.invalid','ORG_ADMIN');exception when insufficient_privilege then v_refused:=true;end;
  if not v_refused then raise exception 'FAIL: participant created privileged invitation';end if;
  if (select count(*) from public.sweep_assessment_submissions)<>1 then raise exception 'FAIL: own result invisible';end if;
end $$;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.hr'),'role','authenticated')::text,true);
do $$begin
  if exists(select 1 from public.sweep_assessment_submissions) or exists(select 1 from public.sweep_cases) then raise exception 'FAIL: HR sees sensitive records';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.outsider'),'role','authenticated')::text,true);
do $$declare v_denied boolean:=false;begin
  if exists(select 1 from public.sweep_campaigns where tenant_id=current_setting('sweep_test.tenant')::uuid) or exists(select 1 from public.sweep_assessment_submissions) then raise exception 'FAIL: cross-tenant read';end if;
  begin perform public.sweep_directory(current_setting('sweep_test.tenant')::uuid);exception when insufficient_privilege then v_denied:=true;end;
  if not v_denied then raise exception 'FAIL: cross-tenant directory visible';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.pro'),'role','authenticated')::text,true);
do $$begin if (select count(*) from public.sweep_cases where tenant_id=current_setting('sweep_test.tenant')::uuid)<>1 or exists(select 1 from public.sweep_cases where classification='CLASS_F_SAFEGUARDING') then raise exception 'FAIL: professional class boundary';end if;end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.officer'),'role','authenticated')::text,true);
do $$begin if (select count(*) from public.sweep_cases where tenant_id=current_setting('sweep_test.tenant')::uuid)<>1 or exists(select 1 from public.sweep_cases where classification='CLASS_D_SENSITIVE_WELLBEING') then raise exception 'FAIL: safeguarding class boundary';end if;end $$;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.admin'),'role','authenticated')::text,true);
do $$declare v_session uuid;begin
  perform public.sweep_session_command(current_setting('sweep_test.tenant')::uuid,'CREATE',jsonb_build_object('title','Reviewed integration session','materials','Reviewed session notes','facilitatorId',current_setting('sweep_test.trainer'),'scheduledAt',now()+interval '1 day'));
  select id into v_session from public.sweep_delivery_sessions where tenant_id=current_setting('sweep_test.tenant')::uuid;
  perform set_config('sweep_test.session',v_session::text,true);
  perform public.sweep_session_command(current_setting('sweep_test.tenant')::uuid,'ENROLL',jsonb_build_object('sessionId',v_session,'participantId',current_setting('sweep_test.participant')));
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.trainer'),'role','authenticated')::text,true);
do $$declare v_denied boolean:=false;begin
  if exists(select 1 from public.sweep_delivery_sessions) or exists(select 1 from public.sweep_session_roster(current_setting('sweep_test.tenant')::uuid)) then raise exception 'FAIL: unapproved trainer materials visible';end if;
  begin perform public.sweep_session_command(current_setting('sweep_test.tenant')::uuid,'APPROVE',jsonb_build_object('sessionId',current_setting('sweep_test.session')));exception when insufficient_privilege then v_denied:=true;end;
  if not v_denied then raise exception 'FAIL: trainer approved own session';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.admin'),'role','authenticated')::text,true);
select public.sweep_session_command(current_setting('sweep_test.tenant')::uuid,'APPROVE',jsonb_build_object('sessionId',current_setting('sweep_test.session')));
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.trainer'),'role','authenticated')::text,true);
do $$begin
  if (select count(*) from public.sweep_session_roster(current_setting('sweep_test.tenant')::uuid))<>1 then raise exception 'FAIL: assigned roster missing';end if;
  if exists(select 1 from public.sweep_assessment_submissions) or exists(select 1 from public.sweep_cases) then raise exception 'FAIL: trainer sees sensitive wellbeing';end if;
  perform public.sweep_session_command(current_setting('sweep_test.tenant')::uuid,'ATTENDANCE',jsonb_build_object('sessionId',current_setting('sweep_test.session'),'participantId',current_setting('sweep_test.participant'),'attended',true));
  perform public.sweep_session_command(current_setting('sweep_test.tenant')::uuid,'COMPLETE',jsonb_build_object('sessionId',current_setting('sweep_test.session')));
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.participant'),'role','authenticated')::text,true);
do $$begin if (select count(*) from public.sweep_delivery_sessions)<>1 then raise exception 'FAIL: enrolled participant session missing';end if;end $$;

-- An invitation is accepted only by its verified recipient; existing roles do
-- not change even when a later invitation or user-editable metadata says admin.
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.admin'),'role','authenticated')::text,true);
select public.sweep_invite(current_setting('sweep_test.tenant')::uuid,current_setting('sweep_test.outsider')||'@example.invalid','PARTICIPANT');
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.hr'),'role','authenticated','user_metadata',jsonb_build_object('role','ORG_ADMIN'))::text,true);
do $$begin if public.sweep_accept_invitations()<>0 then raise exception 'FAIL: another email accepted invitation';end if;end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('sweep_test.outsider'),'role','authenticated','user_metadata',jsonb_build_object('role','ORG_ADMIN'))::text,true);
do $$begin
  if public.sweep_accept_invitations()<>1 then raise exception 'FAIL: verified invitee could not accept';end if;
  if public.sweep_accept_invitations()<>0 then raise exception 'FAIL: invitation replay';end if;
  if private.sweep_has_role(current_setting('sweep_test.tenant')::uuid,array['ORG_ADMIN']) then raise exception 'FAIL: metadata granted administrator';end if;
end $$;

reset role;
do $$declare v_blocked boolean:=false;begin
  begin update public.sweep_assessment_submissions set responses='{}' where campaign_id=current_setting('sweep_test.campaign')::uuid;exception when sqlstate '55000' then v_blocked:=true;end;
  if not v_blocked then raise exception 'FAIL: submitted answers mutable';end if;
  if not exists(select 1 from public.sweep_audit_events where resource_type='assessment_submission' and tenant_id=current_setting('sweep_test.tenant')::uuid) then raise exception 'FAIL: submission audit missing';end if;
end $$;
rollback;
select 'PASS: consent withdrawal, scoring, duplicate rejection, role boundaries, tenant isolation, immutable results, audits, last-admin protection, trainer review/attendance and verified-email invitations' as result;
