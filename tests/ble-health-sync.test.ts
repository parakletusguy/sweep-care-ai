import { describe, it, expect, beforeEach } from 'vitest';
import { BleSyncManager } from '../src/domain/health/ble/ble-sync-manager';
import { HealthPlatformSyncAdapter } from '../src/domain/health/adapters/healthkit-adapter';
import { HealthManager } from '../src/domain/health/health-manager';
import { TenantContextStore } from '../src/domain/tenancy/tenant-context';

describe('Hardware BLE & Mobile Health Platform Adapters (PRD §50, §51)', () => {
  const tenantId = 'tenant-ble-test';
  const participantId = 'user-ble-001';
  const consentScopeId = 'consent-ble-v1';

  beforeEach(() => {
    HealthManager._clearAll();
    HealthManager.registerConsentScope(consentScopeId);
  });

  // 1. Decode BLE Blood Pressure 0x2A35
  it('correctly decodes standard Bluetooth SIG 0x2A35 Blood Pressure binary buffer', () => {
    // 0x2A35 payload:
    // Byte 0: Flags (0 = mmHg, no timestamp, no pulse)
    // Bytes 1-2: Systolic 120 (0x0078 in SFLOAT: exponent 0, mantissa 120 = 0x0078)
    // Bytes 3-4: Diastolic 80 (0x0050 in SFLOAT: exponent 0, mantissa 80 = 0x0050)
    // Bytes 5-6: MAP 93 (0x005D in SFLOAT: exponent 0, mantissa 93 = 0x005D)
    const buffer = new Uint8Array([0x00, 0x78, 0x00, 0x50, 0x00, 0x5d, 0x00]);

    const reading = BleSyncManager.parseBloodPressureCharacteristic(buffer);
    expect(reading.systolicMmHg).toBe(120);
    expect(reading.diastolicMmHg).toBe(80);
    expect(reading.meanArterialPressureMmHg).toBe(93);
    expect(reading.unit).toBe('mmHg');
  });

  // 2. Decode BLE Heart Rate 0x2A37 (8-bit and 16-bit)
  it('correctly decodes standard Bluetooth SIG 0x2A37 Heart Rate 8-bit buffer', () => {
    // Byte 0: Flags (0x06 = 8-bit HR, sensor contact detected)
    // Byte 1: 72 bpm
    const buffer = new Uint8Array([0x06, 0x48]);

    const reading = BleSyncManager.parseHeartRateCharacteristic(buffer);
    expect(reading.bpm).toBe(72);
    expect(reading.sensorContactDetected).toBe(true);
  });

  it('correctly decodes standard Bluetooth SIG 0x2A37 Heart Rate 16-bit buffer', () => {
    // Byte 0: Flags (0x01 = 16-bit HR)
    // Bytes 1-2: 135 bpm (0x0087)
    const buffer = new Uint8Array([0x01, 0x87, 0x00]);

    const reading = BleSyncManager.parseHeartRateCharacteristic(buffer);
    expect(reading.bpm).toBe(135);
  });

  // 3. End-to-end BLE sync into HealthManager
  it('syncs decoded BLE blood pressure reading into health manager with DEVICE_VERIFIED provenance', async () => {
    await TenantContextStore.run(
      {
        tenantId,
        userId: participantId,
        role: 'PARTICIPANT',
      },
      async () => {
        const reading = {
          systolicMmHg: 118,
          diastolicMmHg: 76,
          unit: 'mmHg' as const,
        };

        const result = await BleSyncManager.syncBloodPressure({
          participantId,
          reading,
          consentScopeId,
          deviceModel: 'Withings BPM Connect',
        });

        expect(result.systolicRecord.id).toBeTruthy();
        expect(result.systolicRecord.dataType).toBe('BLOOD_PRESSURE_SYSTOLIC');
        expect(result.systolicRecord.value).toBe(118);
        expect(result.systolicRecord.source).toBe('DEVICE_BLE');
        expect(result.systolicRecord.deviceModel).toBe('Withings BPM Connect');
        expect(result.systolicRecord.verificationStatus).toBe('DEVICE_VERIFIED');

        expect(result.diastolicRecord.dataType).toBe('BLOOD_PRESSURE_DIASTOLIC');
        expect(result.diastolicRecord.value).toBe(76);
      }
    );
  });

  // 4. Apple HealthKit Adapter sync
  it('transforms Apple HealthKit records into standard SWEEP Care health measurements', async () => {
    await TenantContextStore.run(
      {
        tenantId,
        userId: participantId,
        role: 'PARTICIPANT',
      },
      async () => {
        const record = await HealthPlatformSyncAdapter.syncHealthKitRecord({
          participantId,
          record: {
            identifier: 'HKQuantityTypeIdentifierHeartRate',
            value: 65,
            unit: 'bpm',
            startDate: new Date().toISOString(),
            sourceName: 'Apple Watch Ultra 2',
          },
          consentScopeId,
        });

        expect(record).not.toBeNull();
        expect(record?.dataType).toBe('HEART_RATE_BPM');
        expect(record?.value).toBe(65);
        expect(record?.source).toBe('APPLE_HEALTH_API');
        expect(record?.deviceModel).toBe('Apple Watch Ultra 2');
        expect(record?.verificationStatus).toBe('DEVICE_VERIFIED');
      }
    );
  });

  // 5. Google Health Connect Adapter sync
  it('transforms Google Health Connect records into standard SWEEP Care health measurements', async () => {
    await TenantContextStore.run(
      {
        tenantId,
        userId: participantId,
        role: 'PARTICIPANT',
      },
      async () => {
        const record = await HealthPlatformSyncAdapter.syncGoogleHealthConnectRecord({
          participantId,
          record: {
            recordType: 'StepsRecord',
            numericValue: 8420,
            unit: 'steps',
            startTime: new Date().toISOString(),
            clientPackageName: 'com.google.android.apps.fitness',
          },
          consentScopeId,
        });

        expect(record).not.toBeNull();
        expect(record?.dataType).toBe('PHYSICAL_ACTIVITY_STEPS');
        expect(record?.value).toBe(8420);
        expect(record?.source).toBe('GOOGLE_HEALTH_CONNECT_API');
      }
    );
  });
});
