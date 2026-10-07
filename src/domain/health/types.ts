/**
 * SWEEP Care AI — Health Data Types (PRD §50, §51, §55 Class E)
 *
 * Class E Sensitive Health Data includes physiological measurements
 * collected via manual entry, device sync, or health APIs.
 *
 * RULE 7: Safe defaults — feature disabled by default, least privilege.
 * RULE 12: Preserve tenant boundaries.
 * RULE 15: Prohibited features remain prohibited (autonomous diagnosis).
 */

export type HealthDataType =
  | 'BLOOD_PRESSURE_SYSTOLIC'
  | 'BLOOD_PRESSURE_DIASTOLIC'
  | 'HEART_RATE_BPM'
  | 'HEART_RATE_VARIABILITY_MS'
  | 'BLOOD_GLUCOSE_MG_DL'
  | 'SLEEP_MINUTES'
  | 'PHYSICAL_ACTIVITY_STEPS'
  | 'OXYGEN_SATURATION_PERCENT'
  | 'WEIGHT_KG';

export type HealthMeasurementSource =
  | 'MANUAL_ENTRY'
  | 'DEVICE_BLE'
  | 'APPLE_HEALTH_API'
  | 'GOOGLE_HEALTH_CONNECT_API';

export type HealthVerificationStatus =
  | 'UNVERIFIED_SELF_REPORT'
  | 'DEVICE_VERIFIED'
  | 'CLINICAL_VALIDATED';

export interface HealthMeasurement {
  id: string;
  tenantId: string;
  participantId: string;
  dataType: HealthDataType;
  value: number;
  unit: string;
  source: HealthMeasurementSource;
  deviceModel?: string;
  verificationStatus: HealthVerificationStatus;
  consentScopeId: string;
  recordedAt: string; // ISO 8601
  createdAt: string;  // ISO 8601
}

export interface IngestMeasurementPayload {
  participantId: string;
  dataType: HealthDataType;
  value: number;
  unit: string;
  source: HealthMeasurementSource;
  deviceModel?: string;
  verificationStatus?: HealthVerificationStatus;
  consentScopeId: string;
  recordedAt?: string;
}
