---
name: privacy-preserving-population-analytics
description: >-
  Technical algorithms and mathematical guidelines for small-group privacy preservation, 
  k-anonymity, cell suppression, and anti-differencing controls in population analytics dashboards. 
  Use when building aggregated organization reporting, department filtering, segmentation engines, 
  and export functions for HR and leadership roles.
---

# Privacy-Preserving Population Analytics (SWEEP Care AI)

## Target Audience & Governance Context
Designed for HR Directors, People Leads, School Heads, and Organizational Administrators. The platform must provide actionable population intelligence while making it mathematically impossible for managers to identify or deduce an individual participant's sensitive answers.

---

## 1. Core Principles (PRD §8.6, §14, §36, §62)

1. **Non-Surveillance Guarantee:** SWEEP Care is an intelligence layer for population support, not an employee monitoring tool.
2. **Minimum Cohort Threshold ($K$-Anonymity):**
   - Configurable per tenant via `TenantPolicy.min_cohort_size` (**TBD-PRIV-001**).
   - Safe default: $K = 10$ (or $K = 5$ for small accredited teams with explicit disclosure).
   - If a filtered slice has fewer than $K$ respondents, individual domain scores and response distributions MUST be suppressed.
3. **Anti-Differencing Protection:**
   - Preventing reconstruction via subtraction: If an organization has 12 members in Team A and a manager filters by "Team A minus 1 person", the system must not disclose results if the complement falls below $K$.

---

## 2. Mathematical Suppression & Cell Hiding Algorithm

```typescript
export interface AggregatedCohortResult {
  cohortSize: number;
  isSuppressed: boolean;
  suppressionReason?: 'INSUFFICIENT_SAMPLE_SIZE' | 'SECONDARY_SUPPRESSION';
  domainAverages?: Record<string, number>;
  participationRate?: number;
}

export function aggregateCohort(
  responses: ParticipantResponse[],
  minCohortSize: number
): AggregatedCohortResult {
  const n = responses.length;

  if (n < minCohortSize) {
    return {
      cohortSize: n,
      isSuppressed: true,
      suppressionReason: 'INSUFFICIENT_SAMPLE_SIZE',
      // Suppress all domain scores, distributions, and open-text feedback
    };
  }

  // Calculate unweighted domain averages
  const domainTotals: Record<string, { sum: number; count: number }> = {};
  for (const resp of responses) {
    for (const [domain, score] of Object.entries(resp.scores)) {
      if (!domainTotals[domain]) domainTotals[domain] = { sum: 0, count: 0 };
      domainTotals[domain].sum += score;
      domainTotals[domain].count += 1;
    }
  }

  const domainAverages: Record<string, number> = {};
  for (const [domain, { sum, count }] of Object.entries(domainTotals)) {
    // Round to 1 decimal place to prevent micro-variance deanonymization
    domainAverages[domain] = Math.round((sum / count) * 10) / 10;
  }

  return {
    cohortSize: n,
    isSuppressed: false,
    domainAverages,
  };
}
```

---

## 3. Handling Qualitative / Free-Text Feedback

- Raw free-text responses are classified as **Class D (Sensitive Wellbeing)** data.
- HR and Managers must **never** see raw unaggregated free-text responses tied to user IDs or small departments.
- Free-text synthesis is only presented as an aggregated thematic summary produced by the Grounded AI Orchestrator across cohorts where $N \ge 2K$.
- Any direct quote containing names, titles, or identifying context must be redacted before display.

---

## 4. Non-Causal Reporting Guardrail (PRD §45)

- In all aggregated dashboards and generated impact reports, language must describe observed correlation rather than unproven causality.
- **Allowed:** "Participants in Cohort A reported an average 14% improvement in social connection post-intervention."
- **Prohibited:** "The programme caused a 14% increase in employee mental health." (Unless supported by a verified randomized controlled trial).
