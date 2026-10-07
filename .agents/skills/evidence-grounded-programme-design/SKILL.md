---
name: evidence-grounded-programme-design
description: >-
  Workflows, data models, and prompt structures for generating targeted intervention programmes 
  from assessment findings, managing human approval gates, tracking session delivery, 
  and evaluating longitudinal pre/post outcomes. Use when implementing the Programme Builder, 
  AI Programme Design Engine, facilitator delivery tools, and impact reports.
---

# Evidence-Grounded Programme Design & Evaluation (SWEEP Care AI)

## Target Audience & Operational Context
Designed for Wellbeing Officers, Counsellors, Trainers, Social Workers, and People Leads. This skill bridges the gap between identified population needs and measurable human action.

---

## 1. Programme Lifecycle & State Machine (PRD §43, AC-006)

Every intervention programme must transition through an explicit state machine:

```
DRAFT (AI or manual creation)
  ↓
UNDER_REVIEW (Submitted to qualified human reviewer)
  ↓
APPROVED (Explicit sign-off by Wellbeing Professional or Org Admin)
  ↓
SCHEDULED (Dates, facilitators, and capacity assigned)
  ↓
ACTIVE (Sessions running, participants engaged)
  ↓
COMPLETED (Final session concluded)
  ↓
OUTCOME_REVIEW (Post-assessment collected & analyzed)
  ↓
ARCHIVED
```

**CRITICAL RULE:** An AI-generated programme begins in `DRAFT`. It is mathematically and architecturally prohibited for an AI service or unapproved workflow to set `state = ACTIVE` or `state = APPROVED` (AC-006, §78).

---

## 2. Knowledge-Grounded Generation Architecture (PRD §40, §41)

When an authorized user clicks **"Design programme from findings"**:

1. **Input Payload Assembly:**
   - Population segment metadata (e.g., "Engineering Dept, N=45").
   - Aggregated assessment findings (e.g., "Stress domain score = 42/100, declining over 2 cycles").
   - Organization constraints (duration: 4 weeks, delivery: hybrid, budget: moderate).
2. **Knowledge Retrieval:**
   - Query approved knowledge repository for evidence-based interventions targeting the identified domain.
3. **Structured Draft Schema:**
   The AI Orchestrator must output a structured JSON schema:
   ```json
   {
     "title": "Restoring Boundary & Cognitive Rest Program",
     "problem_statement": "Elevated cognitive overload and after-hours communication friction reported in recent assessment.",
     "target_population": "Engineering Team (N=45)",
     "objectives": [
       "Establish asynchronous team communication agreements",
       "Implement structured micro-rest routines during high-focus sprints"
     ],
     "status": "DRAFT",
     "wording_classification": "SUGGESTED_APPROACH",
     "supporting_evidence": [
       {
         "source_id": "KB-SRC-104",
         "title": "WHO Guidelines on Mental Health at Work",
         "verified": true
       }
     ],
     "sessions": [
       { "session_number": 1, "title": "Audit of Communication Load", "duration_minutes": 60 },
       { "session_number": 2, "title": "Designing Rest Boundaries", "duration_minutes": 45 }
     ],
     "measurement_plan": {
       "baseline_assessment_id": "ASM-V1-2026",
       "post_assessment_trigger_days_after": 7
     }
   }
   ```
4. **Wording Guardrail (PRD §40):**
   Unless the supporting citation is an approved randomized clinical standard in the knowledge base, the programme must be labeled **"Suggested programme approach"** and NEVER "Proven intervention" or "WHO approved".

---

## 3. Pre/Post Outcome Measurement Framework (PRD §45)

To evaluate programme impact:
- **Baseline Measure:** Captured via campaign preceding the programme.
- **Intervention:** Participant session attendance and milestone completion tracked in `Attendance` records.
- **Post-Assessment:** Automated follow-up campaign dispatched $X$ days post-programme, re-using the **exact same instrument version** (AC-002).
- **Outcome Delta:**
  $$\Delta_{\text{domain}} = \bar{X}_{\text{post}} - \bar{X}_{\text{baseline}}$$
  Reported with sample size, completion rate, and explicit non-causal language.
