/**
 * PRD §24 Supported Question Types
 */
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  LIKERT_SCALE = 'LIKERT_SCALE',
  NUMERIC = 'NUMERIC',
  YES_NO = 'YES_NO',
  SHORT_TEXT = 'SHORT_TEXT',
  LONG_TEXT = 'LONG_TEXT',
  SLIDER = 'SLIDER',
  DATE = 'DATE',
  MATRIX = 'MATRIX',
}

/**
 * PRD §26 Validated Instrument Verification Status
 */
export enum ValidationStatus {
  VERIFIED_EXTERNAL = 'VERIFIED_EXTERNAL',
  UNVERIFIED = 'UNVERIFIED',
  ORGANIZATION_CUSTOM = 'ORGANIZATION_CUSTOM',
}

export interface AssessmentQuestion {
  id: string;
  domainId: string;
  type: QuestionType;
  prompt: string;
  isRequired: boolean;
  options?: { label: string; value: number | string }[];
  scoringWeight?: number;
  reverseScored?: boolean;
  minScale?: number;
  maxScale?: number;
}

export interface AssessmentDomain {
  id: string;
  name: string;
  description?: string;
}

export interface AssessmentDefinition {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  version: number; // e.g. 1, 2, 3
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  validationStatus: ValidationStatus;
  instrumentSource?: string;
  domains: AssessmentDomain[];
  questions: AssessmentQuestion[];
  hasSubmissions: boolean; // AC-002 immutability lock flag
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentCampaign {
  id: string;
  tenantId: string;
  assessmentId: string;
  assessmentVersion: number; // Locked version (AC-002)
  title: string;
  targetUnitIds: string[]; // Organization units targeted
  isAnonymous: boolean;
  minCohortSize: number; // TBD-PRIV-001 (default 10)
  opensAt: string;
  closesAt: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
}
