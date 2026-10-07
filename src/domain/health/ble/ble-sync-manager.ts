/**
 * SWEEP Care AI — BLE Health GATT Decoder & Sync Manager (PRD §50, §51)
 *
 * Implements standard IEEE-11073 / Bluetooth SIG binary payload decoders:
 * - Blood Pressure Measurement (0x2A35)
 * - Heart Rate Measurement (0x2A37)
 *
 * Fully retains hardware device provenance with DEVICE_VERIFIED status.
 */

import { HealthManager } from '../health-manager';
import type { HealthMeasurement } from '../types';
import type { BleBloodPressureReading, BleHeartRateReading } from './types';

export class BleSyncManager {
  /**
   * Parse IEEE-11073 SFLOAT (16-bit float with 4-bit exponent, 12-bit mantissa).
   */
  private static parseSfloat(raw: number): number {
    const mantissa = raw & 0x0fff;
    const exponent = raw >> 12;

    // Handle sign for 12-bit mantissa
    const signedMantissa = mantissa >= 0x0800 ? mantissa - 0x1000 : mantissa;
    // Handle sign for 4-bit exponent
    const signedExponent = exponent >= 0x08 ? exponent - 0x10 : exponent;

    return Math.round(signedMantissa * Math.pow(10, signedExponent) * 10) / 10;
  }

  /**
   * Decode Bluetooth SIG Blood Pressure Measurement (0x2A35) byte buffer.
   * Buffer format:
   * Byte 0: Flags (bit 0: unit 0=mmHg 1=kPa, bit 2: pulse present)
   * Bytes 1-2: Systolic compound value
   * Bytes 3-4: Diastolic compound value
   * Bytes 5-6: Mean Arterial Pressure (MAP)
   * Bytes 7+: Optional Pulse Rate (if bit 2 is set)
   */
  static parseBloodPressureCharacteristic(buffer: Uint8Array): BleBloodPressureReading {
    if (buffer.length < 7) {
      throw new Error('Invalid BLE Blood Pressure buffer: minimum 7 bytes required.');
    }

    const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const flags = dataView.getUint8(0);
    const isKpa = (flags & 0x01) !== 0;
    const unit = isKpa ? 'kPa' : 'mmHg';

    const rawSystolic = dataView.getUint16(1, true); // Little endian
    const rawDiastolic = dataView.getUint16(3, true);
    const rawMap = dataView.getUint16(5, true);

    const systolic = this.parseSfloat(rawSystolic);
    const diastolic = this.parseSfloat(rawDiastolic);
    const map = this.parseSfloat(rawMap);

    let pulseRate: number | undefined;
    const hasPulseRate = (flags & 0x04) !== 0;
    if (hasPulseRate && buffer.length >= 9) {
      // If timestamp is not present, pulse starts at offset 7
      pulseRate = this.parseSfloat(dataView.getUint16(7, true));
    }

    return {
      systolicMmHg: systolic,
      diastolicMmHg: diastolic,
      meanArterialPressureMmHg: map,
      pulseRateBpm: pulseRate,
      unit,
    };
  }

  /**
   * Decode Bluetooth SIG Heart Rate Measurement (0x2A37) byte buffer.
   * Buffer format:
   * Byte 0: Flags (bit 0: 0=8-bit UINT 1=16-bit UINT, bit 1-2: sensor contact)
   * Byte 1: HR value (8-bit) or Bytes 1-2 (16-bit)
   */
  static parseHeartRateCharacteristic(buffer: Uint8Array): BleHeartRateReading {
    if (buffer.length < 2) {
      throw new Error('Invalid BLE Heart Rate buffer: minimum 2 bytes required.');
    }

    const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const flags = dataView.getUint8(0);
    const is16Bit = (flags & 0x01) !== 0;
    const sensorContactDetected = (flags & 0x06) === 0x06;

    let bpm: number;
    if (is16Bit) {
      if (buffer.length < 3) {
        throw new Error('Invalid 16-bit BLE Heart Rate buffer.');
      }
      bpm = dataView.getUint16(1, true);
    } else {
      bpm = dataView.getUint8(1);
    }

    return {
      bpm,
      sensorContactDetected,
    };
  }

  /**
   * Sync a decoded BLE Blood Pressure reading into the health manager with DEVICE_VERIFIED provenance.
   */
  static async syncBloodPressure(params: {
    participantId: string;
    reading: BleBloodPressureReading;
    consentScopeId: string;
    deviceModel: string;
  }): Promise<{ systolicRecord: HealthMeasurement; diastolicRecord: HealthMeasurement }> {
    const systolicRecord = await HealthManager.recordMeasurement({
      participantId: params.participantId,
      dataType: 'BLOOD_PRESSURE_SYSTOLIC',
      value: params.reading.systolicMmHg,
      unit: params.reading.unit,
      source: 'DEVICE_BLE',
      deviceModel: params.deviceModel,
      verificationStatus: 'DEVICE_VERIFIED',
      consentScopeId: params.consentScopeId,
      recordedAt: params.reading.timestamp,
    });

    const diastolicRecord = await HealthManager.recordMeasurement({
      participantId: params.participantId,
      dataType: 'BLOOD_PRESSURE_DIASTOLIC',
      value: params.reading.diastolicMmHg,
      unit: params.reading.unit,
      source: 'DEVICE_BLE',
      deviceModel: params.deviceModel,
      verificationStatus: 'DEVICE_VERIFIED',
      consentScopeId: params.consentScopeId,
      recordedAt: params.reading.timestamp,
    });

    return { systolicRecord, diastolicRecord };
  }

  /**
   * Sync a decoded BLE Heart Rate reading into the health manager.
   */
  static async syncHeartRate(params: {
    participantId: string;
    reading: BleHeartRateReading;
    consentScopeId: string;
    deviceModel: string;
  }): Promise<HealthMeasurement> {
    return HealthManager.recordMeasurement({
      participantId: params.participantId,
      dataType: 'HEART_RATE_BPM',
      value: params.reading.bpm,
      unit: 'bpm',
      source: 'DEVICE_BLE',
      deviceModel: params.deviceModel,
      verificationStatus: 'DEVICE_VERIFIED',
      consentScopeId: params.consentScopeId,
    });
  }
}
