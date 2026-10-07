/**
 * SWEEP Care AI — Apple HealthKit & Google Health Connect Platform Adapter (PRD §50, §51)
 *
 * Normalizes device exports from Apple HealthKit and Google Health Connect
 * into standard SWEEP Care Class E HealthMeasurement records.
 */

import { HealthManager } from '../health-manager';
import type { HealthMeasurement, HealthDataType, HealthMeasurementSource } from '../types';

export interface HealthKitRecordPayload {
  identifier: string; // e.g., 'HKQuantityTypeIdentifierBloodPressureSystolic'
  value: number;
  unit: string;
  startDate: string; // ISO 8601
  sourceName?: string; // e.g. 'Apple Watch Series 9', 'Withings Health Mate'
}

export interface GoogleHealthConnectRecordPayload {
  recordType: string; // e.g. 'StepsRecord', 'HeartRateRecord'
  numericValue: number;
  unit: string;
  startTime: string; // ISO 8601
  clientPackageName?: string; // e.g. 'com.google.android.apps.fitness'
}

export class HealthPlatformSyncAdapter {
  /**
   * Map HealthKit identifier to internal HealthDataType.
   */
  private static mapHealthKitIdentifier(id: string): { dataType: HealthDataType; unit: string } | null {
    switch (id) {
      case 'HKQuantityTypeIdentifierBloodPressureSystolic':
        return { dataType: 'BLOOD_PRESSURE_SYSTOLIC', unit: 'mmHg' };
      case 'HKQuantityTypeIdentifierBloodPressureDiastolic':
        return { dataType: 'BLOOD_PRESSURE_DIASTOLIC', unit: 'mmHg' };
      case 'HKQuantityTypeIdentifierHeartRate':
        return { dataType: 'HEART_RATE_BPM', unit: 'bpm' };
      case 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN':
        return { dataType: 'HEART_RATE_VARIABILITY_MS', unit: 'ms' };
      case 'HKQuantityTypeIdentifierBloodGlucose':
        return { dataType: 'BLOOD_GLUCOSE_MG_DL', unit: 'mg/dL' };
      case 'HKQuantityTypeIdentifierStepCount':
        return { dataType: 'PHYSICAL_ACTIVITY_STEPS', unit: 'steps' };
      case 'HKQuantityTypeIdentifierOxygenSaturation':
        return { dataType: 'OXYGEN_SATURATION_PERCENT', unit: '%' };
      case 'HKQuantityTypeIdentifierBodyMass':
        return { dataType: 'WEIGHT_KG', unit: 'kg' };
      default:
        return null;
    }
  }

  /**
   * Ingest an Apple HealthKit quantity record.
   */
  static async syncHealthKitRecord(params: {
    participantId: string;
    record: HealthKitRecordPayload;
    consentScopeId: string;
  }): Promise<HealthMeasurement | null> {
    const mapping = this.mapHealthKitIdentifier(params.record.identifier);
    if (!mapping) {
      return null; // Unsupported health signal (safe default)
    }

    return HealthManager.recordMeasurement({
      participantId: params.participantId,
      dataType: mapping.dataType,
      value: params.record.value,
      unit: mapping.unit,
      source: 'APPLE_HEALTH_API',
      deviceModel: params.record.sourceName ?? 'Apple HealthKit',
      verificationStatus: 'DEVICE_VERIFIED',
      consentScopeId: params.consentScopeId,
      recordedAt: params.record.startDate,
    });
  }

  /**
   * Ingest a Google Health Connect record.
   */
  static async syncGoogleHealthConnectRecord(params: {
    participantId: string;
    record: GoogleHealthConnectRecordPayload;
    consentScopeId: string;
  }): Promise<HealthMeasurement | null> {
    let dataType: HealthDataType;
    let standardUnit: string;

    switch (params.record.recordType) {
      case 'HeartRateRecord':
        dataType = 'HEART_RATE_BPM';
        standardUnit = 'bpm';
        break;
      case 'StepsRecord':
        dataType = 'PHYSICAL_ACTIVITY_STEPS';
        standardUnit = 'steps';
        break;
      case 'BloodGlucoseRecord':
        dataType = 'BLOOD_GLUCOSE_MG_DL';
        standardUnit = 'mg/dL';
        break;
      case 'OxygenSaturationRecord':
        dataType = 'OXYGEN_SATURATION_PERCENT';
        standardUnit = '%';
        break;
      default:
        return null;
    }

    return HealthManager.recordMeasurement({
      participantId: params.participantId,
      dataType,
      value: params.record.numericValue,
      unit: standardUnit,
      source: 'GOOGLE_HEALTH_CONNECT_API',
      deviceModel: params.record.clientPackageName ?? 'Google Health Connect',
      verificationStatus: 'DEVICE_VERIFIED',
      consentScopeId: params.consentScopeId,
      recordedAt: params.record.startTime,
    });
  }
}
