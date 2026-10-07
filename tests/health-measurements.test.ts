import { describe, it, expect, beforeEach } from 'vitest';
import { HealthManager } from '../src/domain/health/health-manager';
import { TenantContextStore } from '../src/domain/tenancy/tenant-context';
import type { IngestMeasurementPayload } from '../src/domain/health/types';

describe('Phase 3: Contextual Health Data & Medical Boundary Enforcement (PRD §50–§54, Class E)', () => {
  const tenantId = 'tenant-acme-health';
  const participantId = 'user-alex-001';
  const consentScope = 'consent-health-v1';

  beforeEach(() => {
    HealthManager._clearAll();
    HealthManager.registerConsentScope(consentScope);
  });

  // 1. Consent gating
  it('rejects health measurement ingestion if participant consent is missing or revoked', async () => {
    await TenantContextStore.run(
      {
        tenantId,
        userId: participantId,
        role: 'PARTICIPANT',
      },
      async () => {
        const payload: IngestMeasurementPayload = {
          participantId,
          dataType: 'BLOOD_PRESSURE_SYSTOLIC',
          value: 122,
          unit: 'mmHg',
          source: 'DEVICE_BLE',
          consentScopeId: 'unauthorized-scope-id', // Not registered
        };

        await expect(HealthManager.recordMeasurement(payload)).rejects.toThrow(
          /Consent scope.*is missing or revoked/i
        );
      }
    );
  });

  // 2. Full provenance retention
  it('records physiological measurement with complete provenance metadata', async () => {
    await TenantContextStore.run(
      {
        tenantId,
        userId: participantId,
        role: 'PARTICIPANT',
      },
      async () => {
        const payload: IngestMeasurementPayload = {
          participantId,
          dataType: 'BLOOD_PRESSURE_SYSTOLIC',
          value: 118,
          unit: 'mmHg',
          source: 'DEVICE_BLE',
          deviceModel: 'Omron Platinum Series',
          verificationStatus: 'DEVICE_VERIFIED',
          consentScopeId: consentScope,
        };

        const record = await HealthManager.recordMeasurement(payload);

        expect(record.id).toBeTruthy();
        expect(record.tenantId).toBe(tenantId);
        expect(record.participantId).toBe(participantId);
        expect(record.source).toBe('DEVICE_BLE');
        expect(record.deviceModel).toBe('Omron Platinum Series');
        expect(record.verificationStatus).toBe('DEVICE_VERIFIED');
        expect(record.consentScopeId).toBe(consentScope);
      }
    );
  });

  // 3. Strict HR Lockout (AC-007, PRD §53)
  it('strictly blocks HR_MANAGER role from querying Class E physiological measurements', async () => {
    // First record a measurement as participant
    await TenantContextStore.run(
      {
        tenantId,
        userId: participantId,
        role: 'PARTICIPANT',
      },
      async () => {
        await HealthManager.recordMeasurement({
          participantId,
          dataType: 'BLOOD_GLUCOSE_MG_DL',
          value: 92,
          unit: 'mg/dL',
          source: 'MANUAL_ENTRY',
          consentScopeId: consentScope,
        });
      }
    );

    // Now attempt query as HR_MANAGER
    await TenantContextStore.run(
      {
        tenantId,
        userId: 'user-hr-lead',
        role: 'HR_MANAGER',
      },
      async () => {
        await expect(HealthManager.getMeasurementsForParticipant(participantId)).rejects.toThrow(
          /HR_MANAGER cannot access Class E individual health records/i
        );
      }
    );
  });

  // 4. Participant can view their own data
  it('allows participant to view their own recorded health measurements', async () => {
    await TenantContextStore.run(
      {
        tenantId,
        userId: participantId,
        role: 'PARTICIPANT',
      },
      async () => {
        await HealthManager.recordMeasurement({
          participantId,
          dataType: 'HEART_RATE_BPM',
          value: 68,
          unit: 'bpm',
          source: 'APPLE_HEALTH_API',
          consentScopeId: consentScope,
        });

        const records = await HealthManager.getMeasurementsForParticipant(participantId);
        expect(records).toHaveLength(1);
        expect(records[0].dataType).toBe('HEART_RATE_BPM');
        expect(records[0].value).toBe(68);
      }
    );
  });

  // 5. Medical boundary enforcement (PRD §52, §54)
  it('evaluates Blood Pressure against 2017 ACC/AHA protocol without making autonomous disease diagnosis', () => {
    // Normal reading
    const normalResult = HealthManager.evaluateContext('BLOOD_PRESSURE_SYSTOLIC', 115, 75);
    expect(normalResult.isWithinNormalRange).toBe(true);
    expect(normalResult.severity).toBe('NORMAL');
    expect(normalResult.isDiagnostic).toBe(false);
    expect(normalResult.protocol.protocolId).toBe('ACC_AHA_2017_BP');

    // Elevated Stage 2 reading
    const elevatedResult = HealthManager.evaluateContext('BLOOD_PRESSURE_SYSTOLIC', 145, 92);
    expect(elevatedResult.isWithinNormalRange).toBe(false);
    expect(elevatedResult.severity).toBe('HIGH');
    expect(elevatedResult.requiresMedicalConsultationPrompt).toBe(true);
    expect(elevatedResult.isDiagnostic).toBe(false);
    expect(elevatedResult.guidanceText).toContain('primary care physician');
  });

  // 6. Fasting glucose evaluation against ADA 2024 standards
  it('evaluates Fasting Glucose against ADA 2024 standards with non-diagnostic boundaries', () => {
    const normalGlucose = HealthManager.evaluateContext('BLOOD_GLUCOSE_MG_DL', 88);
    expect(normalGlucose.isWithinNormalRange).toBe(true);
    expect(normalGlucose.severity).toBe('NORMAL');
    expect(normalGlucose.protocol.protocolId).toBe('ADA_2024_GLUCOSE');

    const lowGlucose = HealthManager.evaluateContext('BLOOD_GLUCOSE_MG_DL', 62);
    expect(lowGlucose.isWithinNormalRange).toBe(false);
    expect(lowGlucose.severity).toBe('CRITICAL_OUT_OF_RANGE');
    expect(lowGlucose.requiresMedicalConsultationPrompt).toBe(true);
    expect(lowGlucose.isDiagnostic).toBe(false);
  });
});
