/**
 * SWEEP Care AI — Bluetooth Low Energy (BLE) Health GATT Types (PRD §50, §51)
 *
 * Implements standard Bluetooth SIG GATT Service and Characteristic specifications:
 * - Blood Pressure Service: 0x1810 / Characteristic: 0x2A35
 * - Heart Rate Service: 0x180D / Characteristic: 0x2A37
 * - Glucose Service: 0x1808 / Characteristic: 0x2A18
 */

export const BLE_GATT_SERVICES = {
  BLOOD_PRESSURE: '00001810-0000-1000-8000-00805f9b34fb',
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  GLUCOSE: '00001808-0000-1000-8000-00805f9b34fb',
} as const;

export const BLE_GATT_CHARACTERISTICS = {
  BLOOD_PRESSURE_MEASUREMENT: '00002a35-0000-1000-8000-00805f9b34fb',
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  GLUCOSE_MEASUREMENT: '00002a18-0000-1000-8000-00805f9b34fb',
} as const;

export interface BleBloodPressureReading {
  systolicMmHg: number;
  diastolicMmHg: number;
  meanArterialPressureMmHg?: number;
  pulseRateBpm?: number;
  unit: 'mmHg' | 'kPa';
  deviceModel?: string;
  timestamp?: string;
}

export interface BleHeartRateReading {
  bpm: number;
  sensorContactDetected: boolean;
  energyExpendedJoules?: number;
  rrIntervalsMs?: number[];
  deviceModel?: string;
}
