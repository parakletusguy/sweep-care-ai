---
name: safeguarding-and-crisis-escalation
description: >-
  Deterministic rules, safety classifiers, crisis helpline routing, and escalation protocols 
  for safeguarding events and high-risk participant inputs. Use when implementing safety checks, 
  crisis triggers in assessment submissions, designated safeguarding officer workflows, 
  and crisis resource display components.
---

# Safeguarding & Crisis Escalation Protocol (SWEEP Care AI)

## Target Audience & Safety Context
Designed for Designated Safeguarding Officers, School Welfare Leads, Pastoral Care Leads, and participants experiencing acute distress or crisis. High-stakes safety decisions cannot depend on stochastic generative models.

---

## 1. Dual-Layer Safeguarding Architecture (PRD §60)

```
PARTICIPANT INPUT / ASSESSMENT RESPONSE
                 ↓
       [DETERMINISTIC SAFETY LAYER] (Compiled Regex / Rule Engine)
                 +
       [FAST CLASSIFIER LAYER] (Trained Classifier / Guardrail)
                 ↓
       [SAFETY DECISION LAYER]
                 ↓
       High Risk Flagged?
        ├── YES ──> 1. Show immediate localized crisis support modal to user
        │           2. Create Class F Safeguarding Event in database
        │           3. Dispatch high-priority alert to Designated Officer
        │           4. Log immutable audit entry
        └── NO  ──> Proceed to normal scoring & profile generation
```

### Deterministic Rule Engine (Zero-LLM Latency)
- Triggered by specific high-risk assessment question answers (e.g., self-harm indicators in standardized screening questions).
- Triggered by deterministic keyword / phrase patterns in free-text fields (e.g., explicit threats of suicide, self-harm, or immediate physical abuse).
- **CRITICAL:** Generative AI must **never** be the sole gating mechanism for life-safety escalation.

---

## 2. Global Crisis Support Routing (PRD §61)

**PROHIBITED:** Never hard-code a single global emergency number (e.g., "911" or "999") across all tenants.

Every tenant must configure their jurisdiction-specific crisis resources:
```typescript
export interface CrisisResourceConfig {
  tenantId: string;
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., 'GB', 'US', 'NG', 'KE')
  emergencyNumber: string; // e.g., '999' for UK, '911' for US, '112' for EU
  crisisHelpline: {
    name: string;
    phoneOrText: string;
    hours: string;
    url?: string;
  };
  internalSupportContact?: {
    roleTitle: string;
    contactMethod: string;
  };
}
```

If the user's jurisdiction is unknown or unconfigured:
- The UI must state: *"If you are in immediate danger, please contact your local emergency services or a healthcare professional immediately."*
- It must **never** fabricate a local telephone number or organization.

---

## 3. Data Isolation for Safeguarding (Class F Data, PRD §55)

- Safeguarding records (`RiskEvent`, escalation notes) are classified as **Class F**.
- HR, Managers, Trainers, and standard Org Admins **must never** have read access to Class F records.
- Only users with the explicit `SAFEGUARDING_OFFICER` role assigned by the organization may view escalation records.
- Accessing or modifying a Class F record immediately writes an audit record with user ID, timestamp, and IP address (**AC-009**).
