import { describe, it, expect } from 'vitest';
import { Role, UserSession } from '@/domain/identity/roles';
import { AccessControl, Permission } from '@/domain/identity/permissions';
import { DataClassification } from '@/domain/audit/types';

describe('RBAC & AC-007: Health & Wellbeing Privacy Boundary', () => {
  const hrSession: UserSession = {
    userId: 'user-hr-01',
    tenantId: 'tenant-acme',
    email: 'hr@acme.com',
    role: Role.HR_MANAGER,
  };

  const participantSession: UserSession = {
    userId: 'user-part-01',
    tenantId: 'tenant-acme',
    email: 'alice@acme.com',
    role: Role.PARTICIPANT,
  };

  const wellbeingProSession: UserSession = {
    userId: 'user-pro-01',
    tenantId: 'tenant-acme',
    email: 'dr.smith@care.com',
    role: Role.WELLBEING_PROFESSIONAL,
  };

  const orgAdminSession: UserSession = {
    userId: 'user-admin-01',
    tenantId: 'tenant-acme',
    email: 'admin@acme.com',
    role: Role.ORG_ADMIN,
  };

  it('AC-007: strictly denies HR Manager from viewing raw individual Class D sensitive wellbeing data', () => {
    const canAccess = AccessControl.canAccessParticipantSensitiveData(
      hrSession,
      'user-part-01',
      DataClassification.CLASS_D_SENSITIVE_WELLBEING
    );
    expect(canAccess).toBe(false);
  });

  it('AC-007: strictly denies HR Manager from viewing raw individual Class E sensitive health data', () => {
    const canAccess = AccessControl.canAccessParticipantSensitiveData(
      hrSession,
      'user-part-01',
      DataClassification.CLASS_E_SENSITIVE_HEALTH
    );
    expect(canAccess).toBe(false);
  });

  it('allows participants to view their own Class D wellbeing records', () => {
    const canAccess = AccessControl.canAccessParticipantSensitiveData(
      participantSession,
      'user-part-01',
      DataClassification.CLASS_D_SENSITIVE_WELLBEING
    );
    expect(canAccess).toBe(true);
  });

  it('denies a participant from viewing another participant’s Class D data', () => {
    const canAccess = AccessControl.canAccessParticipantSensitiveData(
      participantSession,
      'user-part-02',
      DataClassification.CLASS_D_SENSITIVE_WELLBEING
    );
    expect(canAccess).toBe(false);
  });

  it('allows authorized Wellbeing Professional to view assigned participant Class D data', () => {
    const canAccess = AccessControl.canAccessParticipantSensitiveData(
      wellbeingProSession,
      'user-part-01',
      DataClassification.CLASS_D_SENSITIVE_WELLBEING
    );
    expect(canAccess).toBe(true);
  });

  it('allows HR Manager to view aggregated population intelligence', () => {
    expect(
      AccessControl.hasPermission(hrSession, Permission.VIEW_AGGREGATED_POPULATION_INTELLIGENCE)
    ).toBe(true);
  });

  it('AC-006: enforces human review gate — only Wellbeing Pro or Org Admin can approve programmes', () => {
    expect(AccessControl.hasPermission(orgAdminSession, Permission.APPROVE_PROGRAMME)).toBe(true);
    expect(AccessControl.hasPermission(wellbeingProSession, Permission.APPROVE_PROGRAMME)).toBe(true);
    expect(AccessControl.hasPermission(hrSession, Permission.APPROVE_PROGRAMME)).toBe(false);
    expect(AccessControl.hasPermission(participantSession, Permission.APPROVE_PROGRAMME)).toBe(false);
  });
});
