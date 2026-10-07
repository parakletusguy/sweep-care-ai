export interface DomainDelta {
  domainId: string;
  domainName: string;
  baselineAverage: number;
  postAverage: number;
  delta: number; // postAverage - baselineAverage
  percentageChange: number;
  direction: 'IMPROVED' | 'DETERIORATED' | 'NO_MEANINGFUL_CHANGE';
}

export interface LongitudinalComparisonResult {
  programmeId: string;
  baselineCampaignId: string;
  postCampaignId: string;
  assessmentVersionId: string;
  baselineCohortSize: number;
  postCohortSize: number;
  completionRatePercent: number;
  domainDeltas: Record<string, DomainDelta>;
  overallIndexDelta: number;
  nonCausalSummaryStatement: string; // PRD §45 guardrail
  limitations: string[];
}

export interface ImpactReportMetadata {
  reportId: string;
  tenantId: string;
  programmeId: string;
  reportingPeriod: string;
  targetPopulation: string;
  assessmentVersion: number;
  isAiAssistedSummary: boolean;
  humanReviewerId?: string;
  generatedAt: string;
}
