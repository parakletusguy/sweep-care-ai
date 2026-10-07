export interface QuestionScoringRule {
  questionId: string;
  domainId: string;
  weight?: number; // Default 1.0
  reverseScore?: boolean;
  minScaleVal?: number; // Default 1
  maxScaleVal?: number; // Default 5
}

export interface DomainScoreCalculation {
  domainId: string;
  rawScore: number;
  maxPossibleScore: number;
  normalizedScore: number; // 0.0 to 100.0 rounded to 1 decimal place
  itemsAnswered: number;
  totalItems: number;
}

export interface AssessmentScoringResult {
  assessmentVersionId: string;
  scoringAlgorithmVersion: string;
  domainScores: Record<string, DomainScoreCalculation>;
  overallIndex?: number; // 0 to 100 composite average
  computedAt: string;
}

export interface IScoringEngineStrategy {
  readonly version: string;
  calculateScores(
    assessmentVersionId: string,
    answers: Record<string, number | string | boolean>,
    rules: QuestionScoringRule[]
  ): AssessmentScoringResult;
}
