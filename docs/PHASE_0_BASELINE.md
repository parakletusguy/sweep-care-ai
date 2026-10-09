# Phase 0 — Verified Baseline

**Recorded:** 9 October 2026  
**Status:** Complete

## Confirmed production foundation

- The hosted SWEEP Care AI project is `pqcyqrgmdriwgzsdefbb`.
- Three tracked migrations have been applied and are recorded remotely:
  `sweep_foundation`, `sweep_security_guard`, and
  `sweep_foundation_indexes`.
- New production tables use the `sweep_` prefix. They sit alongside the
  older, untracked database objects so no unknown legacy data was altered.
- All ten new tables have RLS enabled and forced. The database verification
  confirmed at least one policy on each table.
- Assessment submissions and audit records are append-only at the database
  layer. Browser clients cannot create, change, delete, or read audit rows.
- The historic `public.rls_auto_enable()` privileged function is no longer
  executable by anonymous or signed-in users.
- Every foreign key in the new foundation has a supporting index.

## Deliberately isolated legacy objects

The project already contained untracked tables such as `tenants`, `users`,
`cases`, and `programmes`. They still have RLS enabled but no policies, so
they are not a usable application data layer. They remain isolated rather
than being changed without a verified migration path. New application work
must use only the reviewed `sweep_` tables.

## Guardrails now enforced

- Identity and tenancy are derived from the signed-in Supabase user and an
  active database membership, never from a request body.
- Core-assessment consent, campaign window, participant role, stored scoring
  rules, and an exact answer set are checked before a submission can be saved.
- Scores are calculated by the deterministic TypeScript engine, never an LLM.
- The route fails closed when its server-only `SUPABASE_SECRET_KEY` is absent.
- Migrations are the sole route for schema changes. Direct migration and seed
  scripts remain disabled.

## Evidence

- Automated tests: **25 files, 112 checks passed**.
- TypeScript verification: passed.
- Production build: passed.
- Remote security checks: new tables have forced RLS; public execution of the
  previously flagged privileged function is disabled.

## Next phases

1. Create the first real tenant, authenticated staff member, and participant
   through the normal onboarding flow; no production seed data is created
   automatically.
2. Add the protected case, referral, programme, and connector persistence
   migrations and migrate their screens from demo state.
3. Add database integration tests using dedicated non-production test users,
   including tenant-isolation and HR-denial checks.
