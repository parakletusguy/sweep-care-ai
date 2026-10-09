-- Cover every referenced column order. PostgreSQL does not create these
-- indexes automatically, and they protect both relationship checks and the
-- tenant-aware query paths used by the application.
create index sweep_assessment_versions_assessment_tenant_fk_idx
  on public.sweep_assessment_versions (assessment_id, tenant_id);

create index sweep_assessment_versions_created_by_idx
  on public.sweep_assessment_versions (created_by_id);

create index sweep_assessments_created_by_idx
  on public.sweep_assessments (created_by_id);

create index sweep_campaigns_assessment_version_tenant_fk_idx
  on public.sweep_campaigns (assessment_version_id, tenant_id);

create index sweep_campaigns_created_by_idx
  on public.sweep_campaigns (created_by_id);

create index sweep_submissions_assessment_version_tenant_fk_idx
  on public.sweep_assessment_submissions (assessment_version_id, tenant_id);

create index sweep_submissions_campaign_tenant_fk_idx
  on public.sweep_assessment_submissions (campaign_id, tenant_id);

create index sweep_submissions_tenant_participant_fk_idx
  on public.sweep_assessment_submissions (tenant_id, participant_id);

create index sweep_consents_participant_idx
  on public.sweep_consents (participant_id);
