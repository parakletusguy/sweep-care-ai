import { describe, expect, it } from 'vitest';
import {
  canManageCaseClassification,
  canTransitionCase,
  canTransitionReferral,
  createCaseSchema,
} from '../src/app/api/cases/case-guards';

describe('Phase 2 case workflow guards', () => {
  it('does not grant HR or organization administrators raw individual case access', () => {
    expect(canManageCaseClassification('HR_MANAGER', 'CLASS_D_SENSITIVE_WELLBEING')).toBe(false);
    expect(canManageCaseClassification('ORG_ADMIN', 'CLASS_D_SENSITIVE_WELLBEING')).toBe(false);
    expect(canManageCaseClassification('SUPER_ADMIN', 'CLASS_F_SAFEGUARDING')).toBe(false);
  });

  it('keeps Class D and Class F access separated by role', () => {
    expect(canManageCaseClassification('WELLBEING_PROFESSIONAL', 'CLASS_D_SENSITIVE_WELLBEING')).toBe(true);
    expect(canManageCaseClassification('WELLBEING_PROFESSIONAL', 'CLASS_F_SAFEGUARDING')).toBe(false);
    expect(canManageCaseClassification('SAFEGUARDING_OFFICER', 'CLASS_D_SENSITIVE_WELLBEING')).toBe(false);
    expect(canManageCaseClassification('SAFEGUARDING_OFFICER', 'CLASS_F_SAFEGUARDING')).toBe(true);
  });

  it('rejects arbitrary tenant or participant identifiers before persistence', () => {
    expect(
      createCaseSchema.safeParse({
        tenantId: 'not-a-uuid',
        participantId: 'also-not-a-uuid',
        title: 'A case',
        description: 'A confidential description',
      }).success
    ).toBe(false);
  });

  it('blocks reopening a closed case and terminal referral status changes', () => {
    expect(canTransitionCase('CLOSED', 'ACTIVE_SUPPORT')).toBe(false);
    expect(canTransitionCase('OPEN', 'ACTIVE_SUPPORT')).toBe(true);
    expect(canTransitionReferral('COMPLETED', 'IN_PROGRESS')).toBe(false);
    expect(canTransitionReferral('PENDING_REVIEW', 'ASSIGNED')).toBe(true);
  });
});
