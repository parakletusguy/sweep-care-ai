import { describe, it, expect, beforeEach } from 'vitest';
import { ConsentManager } from '@/domain/consent/consent-manager';
import { ConsentCategory } from '@/domain/consent/types';
import { AuditLogger } from '@/domain/audit/audit-logger';

describe('Sprint 1.3: AC-008 Consent Gates & Privacy by Design', () => {
  const tenantId = 'tenant-school-1';
  const participantId = 'student-alice-01';

  beforeEach(() => {
    ConsentManager._clearForTesting();
    AuditLogger._clearForTesting();
  });

  it('AC-008: blocks assessment submission when CORE_ASSESSMENT consent is missing', () => {
    expect(() => {
      ConsentManager.assertCanSubmitAssessment(tenantId, participantId);
    }).toThrowError(/ConsentRequiredError/);
  });

  it('allows submission after granting CORE_ASSESSMENT consent and writes audit event', () => {
    ConsentManager.grantConsent({
      tenantId,
      userId: participantId,
      category: ConsentCategory.CORE_ASSESSMENT,
      policyVersion: 'v1.0.0',
    });

    expect(() => {
      ConsentManager.assertCanSubmitAssessment(tenantId, participantId);
    }).not.toThrow();

    // Verify audit event written (AC-009)
    const events = AuditLogger.getEventsForTenant(tenantId);
    expect(events.length).toBe(1);
    expect(events[0].action).toBe('CONSENT_GRANTED');
  });

  it('supports modular independent consent tiers', () => {
    // Grant core consent
    ConsentManager.grantConsent({
      tenantId,
      userId: participantId,
      category: ConsentCategory.CORE_ASSESSMENT,
      policyVersion: 'v1.0.0',
    });

    // Tier 2 (Aggregated reporting) not granted yet
    expect(
      ConsentManager.hasActiveConsent(tenantId, participantId, ConsentCategory.AGGREGATED_REPORTING)
    ).toBe(false);

    // Grant Tier 2
    ConsentManager.grantConsent({
      tenantId,
      userId: participantId,
      category: ConsentCategory.AGGREGATED_REPORTING,
      policyVersion: 'v1.0.0',
    });

    expect(
      ConsentManager.hasActiveConsent(tenantId, participantId, ConsentCategory.AGGREGATED_REPORTING)
    ).toBe(true);
  });

  it('revokes consent on demand and re-blocks submission', () => {
    ConsentManager.grantConsent({
      tenantId,
      userId: participantId,
      category: ConsentCategory.CORE_ASSESSMENT,
      policyVersion: 'v1.0.0',
    });

    expect(
      ConsentManager.hasActiveConsent(tenantId, participantId, ConsentCategory.CORE_ASSESSMENT)
    ).toBe(true);

    const revoked = ConsentManager.revokeConsent({
      tenantId,
      userId: participantId,
      category: ConsentCategory.CORE_ASSESSMENT,
    });
    expect(revoked).toBe(true);

    expect(
      ConsentManager.hasActiveConsent(tenantId, participantId, ConsentCategory.CORE_ASSESSMENT)
    ).toBe(false);

    expect(() => {
      ConsentManager.assertCanSubmitAssessment(tenantId, participantId);
    }).toThrowError(/ConsentRequiredError/);

    // Verify audit event for revocation
    const events = AuditLogger.getEventsForTenant(tenantId);
    const revokeEvent = events.find((e) => e.action === 'CONSENT_REVOKED');
    expect(revokeEvent).toBeDefined();
  });

  it('evaluates age boundaries correctly for minor safeguarding (PRD §59, TBD-LEGAL-001)', () => {
    const minorCheck = ConsentManager.evaluateAgeBoundary('2012-05-15', 18);
    expect(minorCheck.isMinor).toBe(true);
    expect(minorCheck.ageYears).toBeLessThan(18);

    const adultCheck = ConsentManager.evaluateAgeBoundary('1995-10-20', 18);
    expect(adultCheck.isMinor).toBe(false);
    expect(adultCheck.ageYears).toBeGreaterThanOrEqual(18);
  });
});
