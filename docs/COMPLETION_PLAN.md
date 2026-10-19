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

## Release verification — 19 October 2026

- Production deployment for commit `846747c7a3996615b2b5e5f26635896ab61f3fb5` is **Ready**. Vercel confirms `careai.sweepacademy.org` and the existing Vercel hostname both alias that deployment.
- The live custom-domain landing page shows the compact “Listen. Understand. Care together.” design, and its sign-in form loads successfully.
- Supabase magic-link and sign-up confirmation templates now use the deployed `/auth/confirm` token-hash endpoint. This avoids requiring an invitation recipient to possess the administrator's browser-specific PKCE verifier.
- Exactly one approved sign-in email was requested from the production form. Resend reports **Delivered** for “Your sign-in link”. Delivery is verified; recipient link-opening and the resulting authenticated browser journey still require confirmation. No sign-in token is recorded here.
- Signed-out production-build checks returned redirects to `/login` for dashboard/admin/assistant/trainer pages and `401` for valid assistant/check-in API requests.
- The CI workflow runs application tests, type checking and the production build. The live database isolation test remains a separately run transactional check; full automated multi-user browser end-to-end coverage is not implemented.

## Implementation handoff

**IMPLEMENTED:** Persisted adult participant onboarding/profile/consent, verified-email invitations, administrator role management, custom numeric assessment publishing and autosave/submission/results, trainer review/attendance workflows, reviewed-resource navigation, compact landing page, limited participant localization, SMTP and custom-domain release.

**TESTED:** 123 application checks, TypeScript, production build, transactional multi-role/two-tenant database tests, signed-out route/API checks, live landing/sign-in rendering, and actual Resend delivery. These checks do not certify clinical suitability or legal compliance.

**NOT IMPLEMENTED:** Live SAML/SCIM/LMS provider adapters (no provider selected), generative assistant synthesis, personal-goal tracking, complete staff translations and approved multilingual assessment content, guardian/minor onboarding, anonymous/targeted campaign submission, and full browser-based multi-user end-to-end automation.

**UNVERIFIED ASSUMPTIONS:** None of the missing provider credentials, clinical content, model configuration or guardian policies is assumed available. Recipient sign-in-link opening is awaiting user confirmation. Organization-reviewed resources must be supplied before source-based answers can be useful.

**MIGRATIONS:** The three additive migrations listed above were applied to the confirmed SWEEP Care project. The database verification creates temporary records inside a transaction and rolls them back; no destructive rollback was performed.

**KNOWN LIMITATIONS:** Leaked-password protection remains unavailable on the current Free project; enabling it requires an approved paid-plan change. An email provider's Delivered event means the receiving mail server accepted the message, not that the recipient opened it or that it avoided the spam folder. Enterprise setup stays inactive until real provider configuration and live tests are available. This is a verified working release, not a declaration that the full PRD is 100% complete.
