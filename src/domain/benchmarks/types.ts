/**
 * SWEEP Care AI — Outcome Intelligence Network Types (PRD §100, §114)
 *
 * Governed, de-identified benchmarking and cross-sector learning.
 *
 * RULE 12: Preserve tenant boundaries — zero unconsented data sharing.
 * RULE 15: Prohibited features remain prohibited.
 */

export interface NetworkOptInContract {
  tenantId: string;
  isOptedIn: boolean;
  authorizedByUserId: string;
  ethicsAgreementVersion: string;
  agreedAt: string;
  revokedAt?: string;
}

export interface DeidentifiedCohortOutcome {
  cohortIdHash: string; // One-way cryptographic hash
  sector: 'corporate' | 'school' | 'church' | 'training';
  interventionCategory: string; // e.g., 'WORKLOAD_BOUNDARIES', 'EXAM_RESILIENCE'
  cohortSizeBracket: '10-25' | '26-50' | '51-100' | '100+';
  baselineAverageScore: number;
  postInterventionAverageScore: number;
  scoreDelta: number;
  relativeImprovementPercent: number;
  durationWeeks: number;
  participantRetentionRate: number;
  contributedAt: string;
}

export interface SectorBenchmarkResult {
  sector: string;
  interventionCategory: string;
  totalParticipatingOrganizations: number;
  totalParticipantsEvaluated: number;
  averageScoreImprovementPercent: number;
  medianScoreDelta: number;
  benchmarkConfidenceLevel: 'HIGH' | 'MODERATE' | 'INSUFFICIENT_DATA';
  isSuppressedDueToSmallSample: boolean;
}
