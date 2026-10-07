import { describe, it, expect, beforeEach } from 'vitest';
import { SafeguardingEngine } from '@/domain/safeguarding/safeguarding-engine';
import { Role, UserSession } from '@/domain/identity/roles';
import { AuditLogger } from '@/domain/audit/audit-logger';
import { DataClassification } from '@/domain/audit/types';

describe('Sprint 1.11: PRD §60 & §61 Safeguarding & Crisis Routing', () => {
  const tenantId = 'tenant-school-uk';

  const safeguardingOfficer: UserSession = {
    userId: 'officer-jane',
    tenantId,
    email: 'safeguarding@stjudes.org',
    role: Role.SAFEGUARDING_OFFICER,
  };

  const hrManager: UserSession = {
    userId: 'hr-mark',
    tenantId,
    email: 'hr@stjudes.org',
    role: Role.HR_MANAGER,
  };

  beforeEach(() => {
    SafeguardingEngine._clearForTesting();
    AuditLogger._clearForTesting();

    // Register UK crisis resource
    SafeguardingEngine.registerCrisisConfig({
      tenantId,
      countryCode: 'GB',
      emergencyNumber: '999',
      crisisHelplineName: 'Childline / Samaritans',
      crisisHelplineContact: '116 123',
      crisisHours: '24/7',
      internalSupportContactTitle: 'School Welfare Lead',
    });

    // Register US crisis resource for international tenant
    SafeguardingEngine.registerCrisisConfig({
      tenantId: 'tenant-corp-us',
      countryCode: 'US',
      emergencyNumber: '911',
      crisisHelplineName: 'Suicide & Crisis Lifeline',
      crisisHelplineContact: '988',
      crisisHours: '24/7',
    });
  });

  it('detects acute crisis keywords deterministically and generates Class F event', () => {
    const result = SafeguardingEngine.evaluateInput({
      tenantId,
      participantId: 'student-99',
      textInput: 'I feel completely overwhelmed and I want to end my life.',
    });

    expect(result.isFlagged).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event!.triggeredKeywords).toContain('end my life');
    expect(result.crisisResources?.emergencyNumber).toBe('999');

    // Verify Class F audit logging (AC-009)
    const events = AuditLogger.getEventsForTenant(tenantId);
    const safetyAudit = events.find((e) => e.classification === DataClassification.CLASS_F_SAFEGUARDING);
    expect(safetyAudit).toBeDefined();
    expect(safetyAudit!.action).toBe('SAFEGUARDING_TRIGGERED');
  });

  it('PRD §61: routes to country-specific emergency numbers rather than hardcoding global 911', () => {
    const ukResource = SafeguardingEngine.resolveCrisisResources(tenantId, 'GB');
    expect(ukResource?.emergencyNumber).toBe('999');
    expect(ukResource?.crisisHelplineContact).toBe('116 123');

    const usResource = SafeguardingEngine.resolveCrisisResources('tenant-corp-us', 'US');
    expect(usResource?.emergencyNumber).toBe('911');
    expect(usResource?.crisisHelplineContact).toBe('988');
  });

  it('restricts access to Class F safeguarding events to SAFEGUARDING_OFFICER role ONLY', () => {
    SafeguardingEngine.evaluateInput({
      tenantId,
      participantId: 'student-99',
      textInput: 'I am cutting myself at night.',
    });

    // Safeguarding officer can read alerts
    const officerAlerts = SafeguardingEngine.getAlertsForOfficer(safeguardingOfficer);
    expect(officerAlerts.length).toBe(1);

    // HR manager is strictly forbidden from reading Class F events
    expect(() => {
      SafeguardingEngine.getAlertsForOfficer(hrManager);
    }).toThrowError(/ClassFAccessDenied/);
  });
});
