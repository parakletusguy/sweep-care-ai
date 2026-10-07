export enum SafetySeverityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL', // Immediate crisis response
}

export interface CrisisResourceConfig {
  tenantId: string;
  countryCode: string; // ISO 3166-1 alpha-2, e.g., 'GB', 'US', 'NG', 'KE'
  emergencyNumber: string; // e.g., '999', '911', '112'
  crisisHelplineName: string;
  crisisHelplineContact: string;
  crisisHours: string;
  internalSupportContactTitle?: string;
  internalSupportMethod?: string;
}

export interface SafeguardingEvent {
  id: string;
  tenantId: string;
  participantId: string;
  severity: SafetySeverityLevel;
  triggeredKeywords: string[];
  assessmentId?: string;
  questionId?: string;
  resolved: boolean;
  assignedOfficerId?: string;
  createdAt: string;
}
