import { z } from 'zod';

export const caseClassificationSchema = z.enum([
  'CLASS_D_SENSITIVE_WELLBEING',
  'CLASS_F_SAFEGUARDING',
]);

export const casePrioritySchema = z.enum(['ROUTINE', 'ELEVATED', 'URGENT', 'CRISIS']);

export const caseStatusSchema = z.enum([
  'OPEN',
  'IN_REVIEW',
  'ACTIVE_SUPPORT',
  'REFERRED',
  'ESCALATED',
  'RESOLVED',
  'CLOSED',
]);

export const referralTypeSchema = z.enum([
  'INTERNAL_PROGRAMME',
  'INTERNAL_SPECIALIST',
  'EXTERNAL_EAP',
  'EXTERNAL_CLINICAL',
  'COMMUNITY_SUPPORT',
]);

export const referralStatusSchema = z.enum([
  'PENDING_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'REFERRED_EXTERNAL',
  'COMPLETED',
  'DECLINED',
  'CANCELLED',
]);

export const resourceIdSchema = z.string().uuid();

export const createCaseSchema = z.object({
  tenantId: resourceIdSchema,
  participantId: resourceIdSchema,
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(12_000),
  priority: casePrioritySchema.default('ROUTINE'),
  classification: caseClassificationSchema.default('CLASS_D_SENSITIVE_WELLBEING'),
});

export const caseQuerySchema = z.object({
  tenantId: resourceIdSchema,
});

export const updateCaseSchema = z.object({
  status: caseStatusSchema,
});

export const createCaseNoteSchema = z.object({
  content: z.string().trim().min(1).max(12_000),
});

export const createReferralSchema = z.object({
  type: referralTypeSchema,
  providerName: z.string().trim().min(2).max(200),
  externalContactInfo: z.string().trim().max(500).optional(),
  reason: z.string().trim().min(2).max(6_000),
  notes: z.string().trim().max(6_000).optional(),
});

export const updateReferralSchema = z.object({
  status: referralStatusSchema,
});

export type CaseClassification = z.infer<typeof caseClassificationSchema>;
export type CaseStatus = z.infer<typeof caseStatusSchema>;
export type ReferralStatus = z.infer<typeof referralStatusSchema>;

/**
 * Least-privilege default for individual sensitive records. Organization
 * administrators, HR, trainers and platform administrators remain excluded
 * until a separately approved, auditable delegation model exists.
 */
export function canManageCaseClassification(
  role: string,
  classification: CaseClassification
): boolean {
  return (
    (classification === 'CLASS_D_SENSITIVE_WELLBEING' && role === 'WELLBEING_PROFESSIONAL') ||
    (classification === 'CLASS_F_SAFEGUARDING' && role === 'SAFEGUARDING_OFFICER')
  );
}

const caseTransitions: Record<CaseStatus, ReadonlySet<CaseStatus>> = {
  OPEN: new Set(['IN_REVIEW', 'ACTIVE_SUPPORT', 'ESCALATED', 'CLOSED']),
  IN_REVIEW: new Set(['ACTIVE_SUPPORT', 'REFERRED', 'ESCALATED', 'CLOSED']),
  ACTIVE_SUPPORT: new Set(['REFERRED', 'ESCALATED', 'RESOLVED', 'CLOSED']),
  REFERRED: new Set(['ACTIVE_SUPPORT', 'ESCALATED', 'RESOLVED', 'CLOSED']),
  ESCALATED: new Set(['ACTIVE_SUPPORT', 'RESOLVED', 'CLOSED']),
  RESOLVED: new Set(['CLOSED']),
  CLOSED: new Set(),
};

export function canTransitionCase(from: CaseStatus, to: CaseStatus): boolean {
  return caseTransitions[from].has(to);
}

const referralTransitions: Record<ReferralStatus, ReadonlySet<ReferralStatus>> = {
  PENDING_REVIEW: new Set(['ASSIGNED', 'IN_PROGRESS', 'REFERRED_EXTERNAL', 'DECLINED', 'CANCELLED']),
  ASSIGNED: new Set(['IN_PROGRESS', 'REFERRED_EXTERNAL', 'DECLINED', 'CANCELLED']),
  IN_PROGRESS: new Set(['REFERRED_EXTERNAL', 'COMPLETED', 'DECLINED', 'CANCELLED']),
  REFERRED_EXTERNAL: new Set(['COMPLETED', 'DECLINED', 'CANCELLED']),
  COMPLETED: new Set(),
  DECLINED: new Set(),
  CANCELLED: new Set(),
};

export function canTransitionReferral(from: ReferralStatus, to: ReferralStatus): boolean {
  return referralTransitions[from].has(to);
}
