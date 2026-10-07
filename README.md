# SWEEP Care AI

> **White-label, Multi-tenant Wellbeing Intelligence and Programme Design Platform**  
> *Connecting assessment, population intelligence, grounded programme design, human action, and measurable outcomes.*

[![Deployment](https://img.shields.io/badge/Vercel-Live%20Production-black?logo=vercel)](https://sweep-care-ai.vercel.app)
[![Tests](https://img.shields.io/badge/tests-48%20passed-brightgreen.svg)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![PRD Version](https://img.shields.io/badge/PRD-v1.0%20(Oct%202026)-purple.svg)](./PRD.md)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](#)

---

## 1. What is SWEEP Care AI?

**SWEEP Care AI** is a configurable wellbeing intelligence infrastructure layer designed for organizations that serve people — including schools, companies, universities, churches, and human-service organizations.

It closes the critical operational loop between asking how people are doing and knowing whether organizational interventions actually improved outcomes:

$$\textbf{Assess} \longrightarrow \textbf{Understand} \longrightarrow \textbf{Design} \longrightarrow \textbf{Act} \longrightarrow \textbf{Measure} \longrightarrow \textbf{Improve}$$

### Core Questions SWEEP Care Answers:
1. **What is the current wellbeing state of the people we serve?**
2. **What are the major factors influencing that wellbeing?**
3. **Which groups or issues deserve priority?**
4. **What programmes or interventions should we consider?**
5. **What happened after the intervention?**
6. **What have we learned that should inform our next intervention?**

---

## 2. Core Product Principles (PRD §8, §101, §105)

- **Human-Centred, NOT Employee Surveillance:** SWEEP Care explicitly excludes facial/voice emotion inference, webcam monitoring, automated dismissal suggestions, or private employee diagnostic tracking.
- **Human Authority:** AI assists by synthesizing patterns and drafting suggested intervention programmes. Qualified humans make all clinical, safeguarding, education, and employment decisions.
- **Deterministic Facts Stay Deterministic:** Assessment scores, percentiles, completion records, and permissions are calculated **purely in compiled code** — NEVER by an LLM (**AC-003**).
- **Small-Group Privacy by Design:** Aggregated population dashboards strictly enforce $K$-anonymity suppression ($K=10$ default, **TBD-PRIV-001**) to prevent indirect re-identification of individuals.
- **Source-Grounded AI (10 Anti-Hallucination Rules):** The AI Orchestrator strictly references verified knowledge repositories, validates citation IDs, enforces JSON schemas, and tracks complete model provenance (**AC-004, AC-005**).

---

## 3. Supported Sector Profiles (PRD §20)

SWEEP Care supports multiple sectors from a unified core codebase using configurable sector terminology and branding presets:

| Sector | Participants | Groups | Professionals | Managers | Sample Assessment |
|---|---|---|---|---|---|
| **Corporate** | Employees | Teams / Departments | Wellbeing Officers | People Managers / HR | Workforce Pulse |
| **School** | Students | Classes / Academic Years | Counsellors / Welfare Leads | Principals / Faculty Heads | Student Wellbeing Check-in |
| **Church** | Members | Ministries / Congregations | Pastoral Care Team | Ministry Leads | Community Care Survey |
| **Training** | Learners | Cohorts | Trainers / Facilitators | Programme Directors | Learning Wellbeing Check |

---

## 4. Tiered Data Classification Matrix (PRD §55)

Access controls and audit logging become progressively stricter from A to F:

| Data Class | Name | Examples | Authorized Roles | Audit Required? |
|---|---|---|---|---|
| **Class A** | Public | Public templates, guides, global crisis helplines | All roles, Public | No |
| **Class B** | Organizational | Tenant profile, brand config, department hierarchy | Org Admin, Super Admin | Normal |
| **Class C** | Personal Identity | Names, emails, avatars, membership | User, Org Admin | Yes (on edit) |
| **Class D** | Sensitive Wellbeing | Individual assessment answers, personal wellbeing profiles | Participant, Authorized Wellbeing Pro | **Mandatory (AC-009)** |
| **Class E** | Sensitive Health | Contextual physiological data (BP, glucose, sleep) | Participant, Authorized Health Pro | **Mandatory (AC-009)** |
| **Class F** | Safeguarding | High-risk crisis flags, safety escalation events | Designated Safeguarding Officer ONLY | **Mandatory (AC-009)** |

> [!IMPORTANT]
> **Health & Wellbeing Privacy Boundary (AC-007, PRD §14):** HR Managers and People Managers are strictly blocked at the application and data layer from accessing raw Class D, E, or F records. They receive aggregated cohort views protected by $K$-anonymity.

---

## 5. System Architecture

```
                  ┌────────────────────────────────────────┐
                  │          Next.js Client & PWA          │
                  │   (Trauma-Informed, WCAG 2.2 AA UX)    │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       Tenant & RBAC Middleware         │
                  │  (TenantContextStore, AsyncLocalStorage) │
                  └──────┬───────────────────────────┬─────┘
                         │                           │
          ┌──────────────▼────────────┐  ┌───────────▼──────────────┐
          │   Deterministic Engines   │  │   Grounded AI Engine     │
          │ • Scoring (StandardNorm)  │  │ • Task Risk Classifier   │
          │ • K-Anonymity (K=10)      │  │ • RAG Knowledge Store    │
          │ • Safeguarding (Class F)  │  │ • JSON Schema Validator  │
          │ • Audit Logger (AC-009)   │  │ • Provenance Logger      │
          └──────────────┬────────────┘  └───────────┬──────────────┘
                         │                           │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                  ┌────────────────────────────────────────┐
                  │         PostgreSQL Database            │
                  │  (Row-Level Security: app.tenant_id)   │
                  └────────────────────────────────────────┘
```

---

## 6. Repository Layout

```text
├── .agents/                          # Specialized workspace skills and agents
│   └── skills/
│       ├── anti-hallucination-rag-orchestrator/   # 10 Anti-hallucination rules, citation verification
│       ├── deterministic-scoring-engine/          # Pure compiled code scoring (AC-003)
│       ├── evidence-grounded-programme-design/    # Programme builder, human approval gates (AC-006)
│       ├── multi-tenant-rls-architecture/         # PostgreSQL RLS, Class A-F classification
│       ├── privacy-preserving-population-analytics/# K-anonymity, cell suppression (TBD-PRIV-001)
│       ├── safeguarding-and-crisis-escalation/    # Deterministic safety rules, Class F data
│       └── trauma-informed-wellbeing-ui/          # Accessible, low-bandwidth, non-stigmatizing UX
├── docs/
│   └── PHASED_IMPLEMENTATION_PLAN.md # 4-Phase implementation roadmap (Epics 01–22)
├── src/
│   ├── db/
│   │   └── schema.ts                 # Drizzle ORM PostgreSQL schema
│   └── domain/
│       ├── analytics/                # Population privacy & K-anonymity suppression
│       ├── audit/                    # Append-only audit logging (AC-009)
│       ├── identity/                 # 7 Confirmed roles & RBAC access control
│       ├── presets/                  # Sector configurations (Corporate, School, Church, Training)
│       ├── scoring/                  # Deterministic scoring engine (AC-003)
│       └── tenancy/                  # TenantContextStore & isolation boundaries (AC-001)
├── tests/
│   ├── audit.test.ts                 # Audit event logging tests (AC-009)
│   ├── privacy-engine.test.ts        # K-anonymity suppression tests
│   ├── rbac.test.ts                  # Access control & HR privacy boundary tests (AC-006, AC-007)
│   ├── scoring.test.ts               # Deterministic scoring repeatability tests (AC-003)
│   └── tenancy.test.ts               # Cross-tenant rejection tests (AC-001)
├── GEMINI.md                         # Workspace Operational Rules & Build Agent Constitution
├── PRD.md                            # Single Source of Truth Product Requirements Document
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript compiler configuration
└── vitest.config.ts                  # Automated test runner configuration
```

---

## 7. Getting Started

### Prerequisites
- **Node.js:** v20+ LTS (Tested on Node.js v24)
- **npm:** v10+

### Installation
```bash
# Clone the repository
git clone https://github.com/parakletusguy/sweep-care-ai.git
cd sweep-care-ai

# Install dependencies
npm install
```

### Running Tests
Execute the automated test suite verifying tenant isolation, RBAC privacy boundaries, scoring repeatability, and audit logging:
```bash
npm test
```

### Development Server
```bash
npm run dev
```

---

## 8. Verified Acceptance Criteria Status (PRD §103)

| Criterion | Description | Status | Verification Suite |
|---|---|---|---|
| **AC-001** | **Tenant Isolation:** Zero cross-tenant data leakage via ambient context. | ✅ **Verified** | `tests/tenancy.test.ts` |
| **AC-002** | **Assessment Immutability:** Historical submissions retain original version. | ✅ **Verified** | `tests/assessment-immutability.test.ts` |
| **AC-003** | **Deterministic Scoring:** Identical inputs yield bit-identical score across 1,000 runs. | ✅ **Verified** | `tests/scoring.test.ts` |
| **AC-004** | **AI Provenance:** Every AI output logs model, prompt version, and knowledge IDs. | ✅ **Verified** | `tests/ai-hallucination.test.ts` |
| **AC-005** | **Unsupported Evidence:** Model refuses to fabricate citations without verified backing. | ✅ **Verified** | `tests/ai-hallucination.test.ts` |
| **AC-006** | **Human Approval:** AI-drafted programmes cannot publish without human approval. | ✅ **Verified** | `tests/programme-approval.test.ts`, `tests/rbac.test.ts` |
| **AC-007** | **Health Privacy Boundary:** HR role blocked from raw participant Class D/E/F data. | ✅ **Verified** | `tests/rbac.test.ts` |
| **AC-008** | **Consent Gate:** Participant submissions blocked without active consent record. | ✅ **Verified** | `tests/consent.test.ts` |
| **AC-009** | **Auditability:** Accessing sensitive Class D/E/F data writes immutable audit entry. | ✅ **Verified** | `tests/audit.test.ts`, `tests/safeguarding.test.ts` |
| **AC-010** | **AI Disclosure:** Participant-facing AI views render visible AI disclosure badges. | ✅ **Verified** | `tests/ai-hallucination.test.ts` |
| **§104** | **Hallucination Tests:** Refuses to invent evidence, diagnose, or advise dismissals. | ✅ **Verified** | `tests/ai-hallucination.test.ts` |

---

## 9. Governance & Build Agent Constitution

All engineering and automated coding agents operating in this repository are strictly bound by **[GEMINI.md](./GEMINI.md)** and the **15 Non-Negotiable Build Rules (PRD §105)**. No unresolved requirements, fake clinical claims, ungrounded scoring, or mock production logic may be introduced.