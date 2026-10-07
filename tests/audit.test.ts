import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLogger } from '@/domain/audit/audit-logger';
import { DataClassification } from '@/domain/audit/types';

describe('AC-009: Append-Only Audit Logging', () => {
  beforeEach(() => {
    AuditLogger._clearForTesting();
  });

  it('records an audit event when sensitive Class D record is accessed', () => {
    const event = AuditLogger.log({
      tenantId: 'tenant-100',
      actorId: 'pro-user-45',
      action: 'READ',
      classification: DataClassification.CLASS_D_SENSITIVE_WELLBEING,
      resourceType: 'AssessmentSubmission',
      resourceId: 'sub-789',
      metadata: { reason: 'Clinical referral review' },
    });

    expect(event.id).toBeDefined();
    expect(event.tenantId).toBe('tenant-100');
    expect(event.classification).toBe(DataClassification.CLASS_D_SENSITIVE_WELLBEING);

    const tenantEvents = AuditLogger.getEventsForTenant('tenant-100');
    expect(tenantEvents.length).toBe(1);
    expect(tenantEvents[0].resourceId).toBe('sub-789');
  });

  it('maintains strict tenant scoping in audit records', () => {
    AuditLogger.log({
      tenantId: 'tenant-aaa',
      actorId: 'user-1',
      action: 'READ',
      classification: DataClassification.CLASS_D_SENSITIVE_WELLBEING,
      resourceType: 'Profile',
      resourceId: 'prof-1',
    });

    AuditLogger.log({
      tenantId: 'tenant-bbb',
      actorId: 'user-2',
      action: 'READ',
      classification: DataClassification.CLASS_F_SAFEGUARDING,
      resourceType: 'RiskEvent',
      resourceId: 'risk-1',
    });

    const eventsA = AuditLogger.getEventsForTenant('tenant-aaa');
    const eventsB = AuditLogger.getEventsForTenant('tenant-bbb');

    expect(eventsA.length).toBe(1);
    expect(eventsA[0].resourceId).toBe('prof-1');
    expect(eventsB.length).toBe(1);
    expect(eventsB[0].resourceId).toBe('risk-1');
  });
});
