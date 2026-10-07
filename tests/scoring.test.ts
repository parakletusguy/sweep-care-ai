import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '@/domain/scoring/scoring-engine';
import { QuestionScoringRule } from '@/domain/scoring/types';

describe('AC-003: Deterministic Scoring Repeatability', () => {
  const rules: QuestionScoringRule[] = [
    { questionId: 'q1', domainId: 'emotional_wellbeing', minScaleVal: 1, maxScaleVal: 5 },
    { questionId: 'q2', domainId: 'emotional_wellbeing', minScaleVal: 1, maxScaleVal: 5, reverseScore: true },
    { questionId: 'q3', domainId: 'social_connectedness', minScaleVal: 1, maxScaleVal: 5 },
  ];

  const answers = {
    q1: 4, // 4/5
    q2: 2, // reversed: 5 - (2 - 1) = 4/5
    q3: 5, // 5/5
  };

  it('calculates mathematically precise normalized scores', () => {
    const result = ScoringEngine.calculate('asm-v1.0', answers, rules);

    // Emotional wellbeing: (4 + 4) / 10 = 80.0%
    expect(result.domainScores['emotional_wellbeing'].normalizedScore).toBe(80.0);
    expect(result.domainScores['emotional_wellbeing'].itemsAnswered).toBe(2);

    // Social connectedness: 5 / 5 = 100.0%
    expect(result.domainScores['social_connectedness'].normalizedScore).toBe(100.0);
    expect(result.domainScores['social_connectedness'].itemsAnswered).toBe(1);

    // Composite index: (80.0 + 100.0) / 2 = 90.0
    expect(result.overallIndex).toBe(90.0);
  });

  it('guarantees bit-identical scores across 1,000 repeated executions (AC-003)', () => {
    const firstResult = ScoringEngine.calculate('asm-v1.0', answers, rules);

    for (let i = 0; i < 1000; i++) {
      const current = ScoringEngine.calculate('asm-v1.0', answers, rules);
      expect(current.domainScores['emotional_wellbeing'].normalizedScore).toBe(
        firstResult.domainScores['emotional_wellbeing'].normalizedScore
      );
      expect(current.domainScores['social_connectedness'].normalizedScore).toBe(
        firstResult.domainScores['social_connectedness'].normalizedScore
      );
      expect(current.overallIndex).toBe(firstResult.overallIndex);
    }
  });
});
