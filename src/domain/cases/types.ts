import { Role } from '../identity/roles';
import { DataClassification } from '../audit/types';

/**
 * Phase 2A: Professional Case Management Lifecycle (PRD §13, §14, §17, §56)
 */
export enum CaseStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  ACTIVE_SUPPORT = 'ACTIVE_SUPPORT',
  REFERRED = 'REFERRED',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum CasePriority {
  ROUTINE = 'ROUTINE',
  ELEVATED = 'ELEVATED',
  URGENT = 'URGENT',
  CRISIS = 'CRISIS',
}

export enum ReferralType {
  INTERNAL_PROGRAMME = 'INTERNAL_PROGRAMME',
  INTERNAL_SPECIALIST = 'INTERNAL_SPECIALIST',
  EXTERNAL_EAP = 'EXTERNAL_EAP',
  EXTERNAL_CLINICAL = 'EXTERNAL_CLINICAL',
  COMMUNITY_SUPPORT = 'COMMUNITY_SUPPORT',
}

export enum ReferralStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  REFERRED_EXTERNAL = 'REFERRED_EXTERNAL',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
}

export interface CaseNote {
  id: string;
  caseId: string;
  tenantId: string;
  authorId: string;
  authorRole: Role;
  content: string;
  classification: DataClassification; // Class D or Class F
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  caseId: string;
  tenantId: string;
  participantId: string;
  referredById: string;
  assignedProfessionalId?: string;
  type: ReferralType;
  status: ReferralStatus;
  providerName: string;
  externalContactInfo?: string;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Case {
  id: string;
  tenantId: string;
  participantId: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  classification: DataClassification;
  assignedProfessionalId?: string;
  openedById: string;
  safeguardingEventId?: string;
  assessmentSubmissionId?: string;
  notes: CaseNote[];
  referrals: Referral[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}
