import { ConsentCategory, ConsentRecord, ParticipantOnboardingProfile } from './types';
import { AuditLogger } from '../audit/audit-logger';
import { DataClassification } from '../audit/types';
import crypto from 'crypto';

/**
 * Consent Centre & Privacy Gate Manager (PRD §58, §59, AC-008)
 * Manages modular 3-tier participant consent, revocation, age-aware checks, and audit logging.
 */
export class ConsentManager {
  private static records: ConsentRecord[] = [];

  /**
   * Grants or updates consent for a specific category.
   */
  public static grantConsent(params: {
    tenantId: string;
    userId: string;
    category: ConsentCategory;
    policyVersion: string;
    ipAddress?: string;
  }): ConsentRecord {
    // Revoke any existing active record for this category
    const existing = this.records.find(
      (r) =>
        r.tenantId === params.tenantId &&
        r.userId === params.userId &&
        r.category === params.category &&
        !r.revokedAt
    );

    if (existing) {
      existing.revokedAt = new Date().toISOString();
    }

    const record: ConsentRecord = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      userId: params.userId,
      category: params.category,
      hasConsented: true,
      policyVersion: params.policyVersion,
      consentedAt: new Date().toISOString(),
    };

    this.records.push(record);

    // Audit log consent grant (AC-009)
    AuditLogger.log({
      tenantId: params.tenantId,
      actorId: params.userId,
      action: 'CONSENT_GRANTED',
      classification: DataClassification.CLASS_C_PERSONAL,
      resourceType: 'ConsentRecord',
      resourceId: record.id,
      metadata: { category: params.category, policyVersion: params.policyVersion },
      ipAddress: params.ipAddress,
    });

    return record;
  }

  /**
   * Revokes consent for a category.
   */
  public static revokeConsent(params: {
    tenantId: string;
    userId: string;
    category: ConsentCategory;
    ipAddress?: string;
  }): boolean {
    const activeRecord = this.records.find(
      (r) =>
        r.tenantId === params.tenantId &&
        r.userId === params.userId &&
        r.category === params.category &&
        !r.revokedAt
    );

    if (!activeRecord) {
      return false;
    }

    activeRecord.revokedAt = new Date().toISOString();
    activeRecord.hasConsented = false;

    // Audit log consent revocation (AC-009)
    AuditLogger.log({
      tenantId: params.tenantId,
      actorId: params.userId,
      action: 'CONSENT_REVOKED',
      classification: DataClassification.CLASS_C_PERSONAL,
      resourceType: 'ConsentRecord',
      resourceId: activeRecord.id,
      metadata: { category: params.category },
      ipAddress: params.ipAddress,
    });

    return true;
  }

  /**
   * Checks whether a participant has active consent for a specific category.
   */
  public static hasActiveConsent(
    tenantId: string,
    userId: string,
    category: ConsentCategory
  ): boolean {
    const record = this.records.find(
      (r) =>
        r.tenantId === tenantId &&
        r.userId === userId &&
        r.category === category &&
        r.hasConsented &&
        !r.revokedAt
    );

    return Boolean(record);
  }

  /**
   * AC-008: Asserts that a participant has active Core Consent before allowing assessment submission.
   */
  public static assertCanSubmitAssessment(tenantId: string, userId: string): void {
    const hasCore = this.hasActiveConsent(tenantId, userId, ConsentCategory.CORE_ASSESSMENT);
    if (!hasCore) {
      throw new Error(
        `ConsentRequiredError: Participant ${userId} lacks active CORE_ASSESSMENT consent.`
      );
    }
  }

  /**
   * Calculates age and determines whether guardian consent is required (PRD §59, TBD-LEGAL-001).
   */
  public static evaluateAgeBoundary(
    dateOfBirthString: string,
    minorAgeThreshold = 18
  ): { isMinor: boolean; ageYears: number } {
    const dob = new Date(dateOfBirthString);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return {
      isMinor: age < minorAgeThreshold,
      ageYears: age,
    };
  }

  public static _clearForTesting(): void {
    this.records = [];
  }
}
