---
name: deterministic-scoring-engine
description: >-
  Specifications and implementation algorithms for the compiled, pure-code deterministic scoring engine. 
  Ensures absolute mathematical repeatability (AC-003), immutability (AC-002), and zero LLM scoring calculation. 
  Use when implementing question scoring rules, domain score aggregations, composite wellbeing indexes, 
  and longitudinal comparison algorithms.
---

# Deterministic Scoring Engine (SWEEP Care AI)

## Core Requirement (PRD §33, AC-003, Constitution Rule 4)

**PROHIBITED:** Assessment scores, domain totals, percentiles, or wellbeing indices must NEVER be calculated by or delegated to an LLM. 

All scores must be calculated via versioned, deterministic, pure algorithms in compiled application code. Re-running the same scoring version on the same raw response vector must yield the exact bit-identical result across millions of runs.

---

## 1. Scoring Architecture & Immutability (PRD §28, AC-002)

```
RAW RESPONSES (Question IDs + Values)
           │
           ▼
[SCORING ENGINE ROUTER] ──> Selects versioned algorithm by `assessment_version_id`
           │
           ▼
[VALIDATION STEP] ──> Validates completeness, required fields, range boundaries
           │
           ▼
[DOMAIN SCORING LOGIC] (Pure function: No I/O, No network, No random seeds)
           │
           ▼
[DETERMINISTIC SCORE RESULT]
  - domain_scores: { "Emotional Wellbeing": 68.5, "Belonging": 74.0, ... }
  - scoring_algorithm_version: "alg-v1.0.0"
  - assessment_version_id: "asm-v2"
  - computed_at: "2026-10-07T10:15:00Z"
```

---

## 2. Pluggable Scoring Strategy Pattern (TBD-CLIN-001)

Until the final proprietary clinical framework is formally approved (**TBD-CLIN-001**), scoring strategies must implement a standardized interface:

```typescript
export interface ScoringRule {
  questionId: string;
  domainId: string;
  weight?: number;
  reverseScore?: boolean;
  minVal?: number;
  maxVal?: number;
}

export interface DomainScoreResult {
  domainId: string;
  rawScore: number;
  normalizedScore: number; // 0 to 100 scale
  itemsAnswered: number;
  totalItems: number;
}

export interface IScoringStrategy {
  version: string;
  calculateDomainScores(
    answers: Record<string, number | string | boolean>,
    rules: ScoringRule[]
  ): Record<string, DomainScoreResult>;
}

export class StandardNormalizedScoringStrategy implements IScoringStrategy {
  public readonly version = 'standard-v1.0.0';

  calculateDomainScores(
    answers: Record<string, number | string | boolean>,
    rules: ScoringRule[]
  ): Record<string, DomainScoreResult> {
    const domainAccumulators: Record<
      string,
      { rawSum: number; maxPossibleSum: number; count: number; total: number }
    > = {};

    for (const rule of rules) {
      if (!domainAccumulators[rule.domainId]) {
        domainAccumulators[rule.domainId] = { rawSum: 0, maxPossibleSum: 0, count: 0, total: 0 };
      }
      domainAccumulators[rule.domainId].total += 1;

      const rawVal = answers[rule.questionId];
      if (typeof rawVal === 'number') {
        let val = rawVal;
        const min = rule.minVal ?? 1;
        const max = rule.maxVal ?? 5;

        // Apply reverse scoring if specified
        if (rule.reverseScore) {
          val = max - (val - min);
        }

        domainAccumulators[rule.domainId].rawSum += val;
        domainAccumulators[rule.domainId].maxPossibleSum += max;
        domainAccumulators[rule.domainId].count += 1;
      }
    }

    const results: Record<string, DomainScoreResult> = {};
    for (const [domainId, acc] of Object.entries(domainAccumulators)) {
      const normalized =
        acc.maxPossibleSum > 0
          ? Math.round((acc.rawSum / acc.maxPossibleSum) * 1000) / 10 // 0 - 100 rounded to 1 decimal
          : 0;

      results[domainId] = {
        domainId,
        rawScore: acc.rawSum,
        normalizedScore: normalized,
        itemsAnswered: acc.count,
        totalItems: acc.total,
      };
    }

    return results;
  }
}
```

---

## 3. Verification & Acceptance Testing (AC-003)

- Automated tests must execute against fixed fixture sets of question answers.
- Test suites must verify that identical inputs generate identical scores across environments, operating systems, and database engines.
