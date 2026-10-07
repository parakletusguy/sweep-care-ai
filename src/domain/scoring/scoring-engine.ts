import {
  AssessmentScoringResult,
  DomainScoreCalculation,
  IScoringEngineStrategy,
  QuestionScoringRule,
} from './types';

/**
 * Standard Normalized Deterministic Scoring Strategy (PRD §33, AC-003, Rule 4)
 * Pure, compiled TypeScript mathematical calculation. Absolute zero LLM involvement.
 */
export class StandardScoringStrategy implements IScoringEngineStrategy {
  public readonly version = 'standard-norm-v1.0.0';

  public calculateScores(
    assessmentVersionId: string,
    answers: Record<string, number | string | boolean>,
    rules: QuestionScoringRule[]
  ): AssessmentScoringResult {
    const domainAccumulators: Record<
      string,
      { rawSum: number; maxPossibleSum: number; count: number; total: number }
    > = {};

    for (const rule of rules) {
      if (!domainAccumulators[rule.domainId]) {
        domainAccumulators[rule.domainId] = {
          rawSum: 0,
          maxPossibleSum: 0,
          count: 0,
          total: 0,
        };
      }
      domainAccumulators[rule.domainId].total += 1;

      const rawVal = answers[rule.questionId];
      if (typeof rawVal === 'number' && !isNaN(rawVal)) {
        const min = rule.minScaleVal ?? 1;
        const max = rule.maxScaleVal ?? 5;
        const weight = rule.weight ?? 1.0;

        let scoreVal = rawVal;
        if (rule.reverseScore) {
          scoreVal = max - (scoreVal - min);
        }

        domainAccumulators[rule.domainId].rawSum += scoreVal * weight;
        domainAccumulators[rule.domainId].maxPossibleSum += max * weight;
        domainAccumulators[rule.domainId].count += 1;
      }
    }

    const domainScores: Record<string, DomainScoreCalculation> = {};
    let totalNormalized = 0;
    let scoredDomainsCount = 0;

    for (const [domainId, acc] of Object.entries(domainAccumulators)) {
      const normalized =
        acc.maxPossibleSum > 0
          ? Math.round((acc.rawSum / acc.maxPossibleSum) * 1000) / 10
          : 0;

      domainScores[domainId] = {
        domainId,
        rawScore: Math.round(acc.rawSum * 10) / 10,
        maxPossibleScore: acc.maxPossibleSum,
        normalizedScore: normalized,
        itemsAnswered: acc.count,
        totalItems: acc.total,
      };

      if (acc.count > 0) {
        totalNormalized += normalized;
        scoredDomainsCount += 1;
      }
    }

    const overallIndex =
      scoredDomainsCount > 0
        ? Math.round((totalNormalized / scoredDomainsCount) * 10) / 10
        : 0;

    return {
      assessmentVersionId,
      scoringAlgorithmVersion: this.version,
      domainScores,
      overallIndex,
      computedAt: new Date().toISOString(),
    };
  }
}

export class ScoringEngine {
  private static strategies: Map<string, IScoringEngineStrategy> = new Map([
    ['standard-norm-v1.0.0', new StandardScoringStrategy()],
  ]);

  public static calculate(
    assessmentVersionId: string,
    answers: Record<string, number | string | boolean>,
    rules: QuestionScoringRule[],
    strategyVersion = 'standard-norm-v1.0.0'
  ): AssessmentScoringResult {
    const strategy = this.strategies.get(strategyVersion);
    if (!strategy) {
      throw new Error(`ScoringStrategyNotFound: Strategy version '${strategyVersion}' is not registered.`);
    }
    return strategy.calculateScores(assessmentVersionId, answers, rules);
  }
}
