/**
 * PRD §43: Programme State Lifecycle
 */
export enum ProgrammeState {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED', // Human approval gate (AC-006)
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  OUTCOME_REVIEW = 'OUTCOME_REVIEW',
  ARCHIVED = 'ARCHIVED',
}

export interface ProgrammeSession {
  sessionNumber: number;
  title: string;
  durationMinutes: number;
  description: string;
}

export interface ProgrammeDefinition {
  id: string;
  tenantId: string;
  title: string;
  problemStatement: string;
  targetPopulation: string;
  objectives: string[];
  sessions: ProgrammeSession[];
  state: ProgrammeState;
  isAiGenerated: boolean;
  wordingClassification: 'SUGGESTED_APPROACH' | 'VERIFIED_CLINICAL';
  supportingKnowledgeSourceIds: string[];
  baselineAssessmentId?: string;
  humanApprovedById?: string;
  humanApprovedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
