/**
 * PRD §58: 3-Tier Modular Consent Categories
 */
export enum ConsentCategory {
  /** Tier 1: Consent to complete assessments and receive personal wellbeing results */
  CORE_ASSESSMENT = 'CORE_ASSESSMENT',

  /** Tier 2: Consent for de-identified data to be aggregated in K-anonymized population intelligence */
  AGGREGATED_REPORTING = 'AGGREGATED_REPORTING',

  /** Tier 3: Consent to route acute safety/crisis alerts to Designated Safeguarding Officers */
  SAFEGUARDING_ESCALATION = 'SAFEGUARDING_ESCALATION',
}

export interface ConsentRecord {
  id: string;
  tenantId: string;
  userId: string;
  category: ConsentCategory;
  hasConsented: boolean;
  policyVersion: string;
  consentedAt: string;
  revokedAt?: string;
}

export interface ParticipantOnboardingProfile {
  userId: string;
  tenantId: string;
  email: string;
  fullName: string;
  dateOfBirth?: string; // YYYY-MM-DD
  isMinor: boolean;
  guardianConsentRequired: boolean;
  guardianConsentRecorded?: boolean;
}
