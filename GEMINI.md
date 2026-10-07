# SWEEP Care AI — Workspace Operational Rules & Build Agent Constitution

This repository contains **SWEEP Care AI**, a white-label, multi-tenant Wellbeing Intelligence and Programme Design Platform. All AI agents, coding assistants, and engineers operating in this codebase are strictly bound by this document, **PRD v1.0**, and the **Build Agent Constitution (§105)**.

---

## 1. Source-of-Truth Hierarchy (PRD §108)
When implementation details conflict, the strict order of precedence is:
1. Explicit approved product decisions
2. Current PRD (`PRD.md`)
3. Approved technical specifications / ADRs
4. Existing verified implementation
5. Developer / agent assumptions (NEVER override higher levels)

---

## 2. The 15 Non-Negotiable Build Rules (PRD §105)

- **RULE 1 — PRD is the Baseline:** Never silently alter product behavior or requirements.
- **RULE 2 — Never Invent Unresolved Requirements:** For any TBD, missing threshold, missing API credential, or missing policy, isolate it in configuration or safe non-production placeholders. Never fabricate business logic.
- **RULE 3 — Do Not Invent External APIs:** Verify actual installed packages, method signatures, and schemas.
- **RULE 4 — Never Invent Assessment Methodology:** No scoring rules, clinical thresholds, norms, or diagnostic criteria may be invented.
- **RULE 5 — Never Invent Legal Compliance Claims:** Do not claim HIPAA/GDPR/NDPA compliance in UI or code without legal certification.
- **RULE 6 — Separate Facts from Assumptions:** Document decisions, reasons, and reversibility.
- **RULE 7 — Safe Defaults:** When in doubt: feature disabled, least privilege, private, human review, no clinical claim.
- **RULE 8 — No Production Mocks:** Mock logic, fake thresholds, or fake user data must never ship to production.
- **RULE 9 — Never Manufacture Successful Actions:** If a notification, email, or DB write fails, report failure.
- **RULE 10 — Verify Before Destructive Migrations:** Always provide backup, rollback, and test strategies.
- **RULE 11 — No Secrets:** Never commit API keys, tokens, or credentials in code or logs.
- **RULE 12 — Preserve Tenant Boundaries:** Every query must enforce tenancy at the database layer (PostgreSQL RLS). Never rely on UI filtering.
- **RULE 13 — Tests Accompany Safety-Critical Code:** Write automated tests for RBAC, tenant isolation, scoring, safeguarding, and AI guardrails.
- **RULE 14 — Source-Ground AI Behavior:** Use the approved knowledge base and RAG. Prohibit free-form LLM hallucination.
- **RULE 15 — Prohibited Features Remain Prohibited:** No employee surveillance, facial/voice emotion analysis, autonomous medical diagnosis, or automated dismissal recommendations.

---

## 3. Required Output Formats (PRD §106)

Before substantial implementation:
```text
IMPLEMENTATION TASK
REQUIREMENTS BEING IMPLEMENTED
FILES/MODULES AFFECTED
KNOWN ASSUMPTIONS
TBDs ENCOUNTERED
SECURITY/PRIVACY IMPACT
TEST PLAN
```

After implementation:
```text
IMPLEMENTED
TESTED
NOT IMPLEMENTED
UNVERIFIED ASSUMPTIONS
MIGRATIONS
KNOWN LIMITATIONS
```
