# Completion plan — 19 October 2026

Scope: the five remaining-work items requested in this chat. The full PRD also contains later candidate capabilities, which are not silently included in this release.

| Phase | Delivery | Evidence required before completion |
| --- | --- | --- |
| 1 — Identity and delivery | Correct sign-in routing; invitation acceptance; administrator-managed roles; profile and consent; custom-domain redirects; Resend SMTP | Verified sender and SMTP configuration; no privilege escalation through metadata; persisted invitation and membership tests |
| 2 — Assessment journey | Author and publish a custom numeric assessment; launch campaign; participant autosave; consent-gated submission; immutable results | Actual database writes, duplicate/closed-campaign rejection, deterministic server calculation, participant-only result visibility |
| 3 — Product experience | Compact landing page; real participant/admin screens; trainer sessions; explicit English/French/Spanish preference | No sample records in connected screens; empty/loading/error states; mobile layout and keyboard controls |
| 4 — Grounded assistant | Tenant-approved resources; exact-source retrieval; refusal when evidence is absent; safety routing; persisted provenance | Injection, diagnosis, medication, employment and missing-source tests; no fabricated citations or staff-notification claims |
| 5 — Enterprise connections | Provider-backed SAML via Supabase; scoped provisioning; LMS connection setup and verified vendor adapter | Identity-provider metadata, supported plan, LMS vendor URL/credentials, mapping review and live provider test |
| 6 — Release | Multi-user database/API checks, CI, production build and deployment | Tests and applied migration history recorded; unresolved external dependencies explicitly listed |

## Implementation decisions

- Authenticated membership rows are authoritative. Profile metadata never assigns roles.
- Invitations are bound to verified email and organization, expire, and can be accepted once.
- HR/admin accounts do not receive individual wellbeing/safeguarding results.
- Assessment content and scoring definitions are entered by authorized staff; no clinical instrument or cutoff is invented.
- Numeric check-ins use the existing `standard-norm-v1.0.0` calculation, displayed as a custom non-diagnostic score. Existing scoring behavior is preserved.
- Anonymous campaigns remain unavailable until an anonymity-preserving submission design is implemented.
- The initial assistant retrieves approved text verbatim. Generative synthesis requires a separately configured model and validation before activation.
- Enterprise connections cannot be marked operational until tested with the customer's actual provider. Missing credentials are not replaced with mock success.

## Rollout and recovery

Use additive migrations, restricted grants, forced RLS and immutable audit events. Apply only to project `pqcyqrgmdriwgzsdefbb`. The previous deployment can be restored without dropping new data. Do not roll back by deleting user records or migrations. Test database isolation using disposable records in a transaction that is rolled back.

## External dependencies to verify

Resend credentials and Supabase SMTP; paid-plan availability for leaked-password checks and SAML; actual SAML identity provider; chosen LMS vendor and credentials; organization-approved resource content; guardian policy for minors. No external dependency is considered resolved until inspected or tested.

## Verified implementation state

- Applied migrations: `20261019201659_completion_workflows`, `20261019203246_completion_hardening`, `20261019203911_session_policy_consolidation`.
- 27 test files / 123 checks pass; TypeScript and the production build pass.
- Transactional multi-user database checks pass for consent withdrawal, deterministic scoring, duplicate rejection, immutable results, tenant and D/F boundaries, metadata escalation denial, verified-email invitation acceptance, last-admin protection, trainer approval, roster and attendance. All test records roll back.
- Supabase advisor now reports only leaked-password protection disabled. The live dashboard confirms this requires Pro or above; the project is on Free. No subscription was changed.
- Resend custom SMTP is enabled with a sending-only key restricted to `careai.sweepacademy.org`; sender `noreply@careai.sweepacademy.org`, host `smtp.resend.com`, port 465. No credential is stored in this repository.
- Supabase site URL is `https://careai.sweepacademy.org`; its exact `/auth/callback` URL is on the allow-list alongside the existing Vercel address.
- Owner confirmed **none yet** for enterprise identity and LMS providers: connection screens remain inactive. No provider adapter is described as connected or tested.
- Resource navigation is retrieval-only; generative synthesis, goal tracking, full staff-screen translations and approved multilingual instrument content are not complete. No approved resource content or model credential is fabricated.
