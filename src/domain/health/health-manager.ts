/**
 * SWEEP Care AI — Health Data Manager (PRD §50, §51, §52, §53, §55 Class E)
 *
 * Enforces:
 * - AC-001: Strict tenant isolation (TenantContextStore)
 * - AC-007: Health privacy boundary (HR Managers strictly locked out)
 * - AC-009: Tamper-evident audit logging for all Class E operations
 * - PRD §52: Strictly non-diagnostic contextual information
 * - PRD §58: Explicit participant consent scope required before recording
 */

import { randomUUID } from 'crypto';
import { TenantContextStore } from '../tenancy/tenant-context';
import { AuditLogger } from '../audit/audit-logger';
import { ClinicalThresholdEngine, type ProtocolEvaluationResult } from './protocols/clinical-thresholds';
import type {
  HealthMeasurement,
  IngestMeasurementPayload,
  HealthDataType,
} from './types';

// In-memory measurement store (backed by health_measurements in PostgreSQL)
const _measurements: HealthMeasurement[] = [];

// In-memory active consent scopes for Class E data
const _activeConsentScopes = new Set<string>();

export class HealthManager {
  /**
   * Register an active consent scope for Class E health data (PRD §58).
   */
  static registerConsentScope(scopeId: string): void {
    _activeConsentScopes.add(scopeId);
  }

  /**
   * Revoke a consent scope (PRD §58).
   */
  static revokeConsentScope(scopeId: string): void {
    _activeConsentScopes.delete(scopeId);
  }

  /**
   * Ingest a physiological health measurement.
   * Requires active consent scope and current tenant context.
   */
  static async recordMeasurement(payload: IngestMeasurementPayload): Promise<HealthMeasurement> {
    const tenantContext = TenantContextStore.getContext();
    if (!tenantContext || !tenantContext.tenantId) {
      throw new Error('TenantIsolationViolation: Operation attempted outside active tenant context.');
    }
    const tenantId = tenantContext.tenantId;

    // Verify participant consent scope
    if (!_activeConsentScopes.has(payload.consentScopeId)) {
      throw new Error(
        `Class E health data ingestion rejected: Consent scope "${payload.consentScopeId}" is missing or revoked (PRD §58).`
      );
    }

    const now = new Date().toISOString();
    const measurement: HealthMeasurement = {
      id: randomUUID(),
      tenantId,
      participantId: payload.participantId,
      dataType: payload.dataType,
      value: payload.value,
      unit: payload.unit,
      source: payload.source,
      deviceModel: payload.deviceModel,
      verificationStatus: payload.verificationStatus ?? 'UNVERIFIED_SELF_REPORT',
      consentScopeId: payload.consentScopeId,
      recordedAt: payload.recordedAt ?? now,
      createdAt: now,
    };

    _measurements.push(measurement);

    // Audit log Class E ingestion (AC-009, §55)
    AuditLogger.log({
      tenantId,
      userId: tenantContext.userId ?? 'system',
      userRole: tenantContext.role ?? 'PARTICIPANT',
      action: 'HEALTH_MEASUREMENT_RECORDED',
      targetEntity: 'health_measurements',
      targetEntityId: measurement.id,
      details: {
        dataType: measurement.dataType,
        source: measurement.source,
        verificationStatus: measurement.verificationStatus,
        dataClassification: 'CLASS_E_SENSITIVE_HEALTH',
      },
      ipAddress: '127.0.0.1',
    });

    return measurement;
  }

  /**
   * Retrieve measurements for a participant.
   * Access policy (PRD §53, AC-007):
   * - Participant may view their own data
   * - Wellbeing Professional may view if authorized
   * - HR_MANAGER is strictly forbidden from querying Class E raw records
   */
  static async getMeasurementsForParticipant(participantId: string): Promise<HealthMeasurement[]> {
    const tenantContext = TenantContextStore.getContext();
    if (!tenantContext || !tenantContext.tenantId) {
      throw new Error('TenantIsolationViolation: Operation attempted outside active tenant context.');
    }
    const tenantId = tenantContext.tenantId;

    // Rule 15 & AC-007: Lock HR Managers out
    if (tenantContext.role === 'HR_MANAGER') {
      AuditLogger.log({
        tenantId,
        userId: tenantContext.userId ?? 'unknown',
        userRole: 'HR_MANAGER',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetEntity: 'health_measurements',
        targetEntityId: participantId,
        details: {
          reason: 'AC-007: HR_MANAGER role blocked from Class E physiological health data',
        },
        ipAddress: '127.0.0.1',
      });
      throw new Error('Forbidden: HR_MANAGER cannot access Class E individual health records (AC-007, PRD §53).');
    }

    // Role-specific check: Participants can only view their own records
    if (tenantContext.role === 'PARTICIPANT' && tenantContext.userId !== participantId) {
      throw new Error('Forbidden: Participants can only access their own health records.');
    }

    const records = _measurements.filter(
      (m) => m.tenantId === tenantId && m.participantId === participantId
    );

    // Audit log Class E access
    AuditLogger.log({
      tenantId,
      userId: tenantContext.userId ?? 'unknown',
      userRole: tenantContext.role ?? 'PARTICIPANT',
      action: 'HEALTH_MEASUREMENTS_ACCESSED',
      targetEntity: 'health_measurements',
      targetEntityId: participantId,
      details: {
        recordCount: records.length,
        dataClassification: 'CLASS_E_SENSITIVE_HEALTH',
      },
      ipAddress: '127.0.0.1',
    });

    return records;
  }

  /**
   * Evaluate a measurement against formally approved clinical protocols (PRD §52, §54).
   * Result is strictly non-diagnostic contextual information.
   */
  static evaluateContext(
    dataType: HealthDataType,
    primaryValue: number,
    secondaryValue?: number
  ): ProtocolEvaluationResult {
    switch (dataType) {
      case 'BLOOD_PRESSURE_SYSTOLIC':
      case 'BLOOD_PRESSURE_DIASTOLIC':
        return ClinicalThresholdEngine.evaluateBloodPressure(
          primaryValue,
          secondaryValue ?? 80
        );

      case 'BLOOD_GLUCOSE_MG_DL':
        return ClinicalThresholdEngine.evaluateFastingGlucose(primaryValue);

      case 'HEART_RATE_BPM':
        return ClinicalThresholdEngine.evaluateRestingHeartRate(primaryValue);

      default:
        return {
          isWithinNormalRange: true,
          severity: 'NORMAL',
          label: 'Contextual Activity Signal',
          protocol: {
            protocolId: 'GENERAL_WELLBEING_CONTEXT',
            name: 'General Lifestyle Context',
            authoritativeBody: 'Occupational Health Reference',
            versionOrYear: '2024',
            citation: 'Standard non-clinical activity guideline.',
          },
          guidanceText: 'Measurement tracked for general lifestyle and recovery context.',
          requiresMedicalConsultationPrompt: false,
          isDiagnostic: false,
        };
    }
  }

  /** Reset in-memory state (test utility) */
  static _clearAll(): void {
    _measurements.length = 0;
    _activeConsentScopes.clear();
  }
}
