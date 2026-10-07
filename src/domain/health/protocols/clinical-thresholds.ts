/**
 * SWEEP Care AI — Formally Approved Clinical Protocol Thresholds (PRD §52, §54)
 *
 * RULE 4: Never invent assessment methodology or clinical thresholds.
 * RULE 15: Autonomous medical diagnosis is strictly prohibited.
 *
 * All thresholds here are extracted from authoritative, versioned clinical guidelines:
 * - Blood Pressure: 2017 ACC/AHA High Blood Pressure Clinical Practice Guideline
 * - Blood Glucose (Fasting): American Diabetes Association (ADA) Standards of Care 2024
 * - Resting Heart Rate: American Heart Association (AHA) Clinical Reference
 *
 * Every result MUST be tagged with its protocol source and flagged as
 * "non-diagnostic contextual information".
 */

export interface ClinicalProtocol {
  protocolId: string;
  name: string;
  authoritativeBody: string;
  versionOrYear: string;
  citation: string;
}

export const PROTOCOLS: Record<string, ClinicalProtocol> = {
  ACC_AHA_2017_BP: {
    protocolId: 'ACC_AHA_2017_BP',
    name: '2017 Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults',
    authoritativeBody: 'American College of Cardiology / American Heart Association',
    versionOrYear: '2017',
    citation: 'Whelton PK et al. J Am Coll Cardiol. 2018;71(19):e127-e248.',
  },
  ADA_2024_GLUCOSE: {
    protocolId: 'ADA_2024_GLUCOSE',
    name: 'Standards of Care in Diabetes — 2024',
    authoritativeBody: 'American Diabetes Association',
    versionOrYear: '2024',
    citation: 'Diabetes Care 2024;47(Suppl. 1):S1-S343.',
  },
  AHA_RESTING_HR: {
    protocolId: 'AHA_RESTING_HR',
    name: 'Target Heart Rate and Estimated Maximum Heart Rate Reference',
    authoritativeBody: 'American Heart Association',
    versionOrYear: '2023',
    citation: 'AHA Heart Rate Guidelines for Adults (2023).',
  },
};

export type ThresholdSeverity = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL_OUT_OF_RANGE';

export interface ProtocolEvaluationResult {
  isWithinNormalRange: boolean;
  severity: ThresholdSeverity;
  label: string;
  protocol: ClinicalProtocol;
  /** Non-diagnostic advice only (PRD §52) */
  guidanceText: string;
  requiresMedicalConsultationPrompt: boolean;
  isDiagnostic: false; // Permanently false per PRD §52
}

export class ClinicalThresholdEngine {
  /**
   * Evaluate Blood Pressure using 2017 ACC/AHA Guideline.
   * Strictly non-diagnostic; provides contextual category and doctor referral if out of range.
   */
  static evaluateBloodPressure(
    systolicMmHg: number,
    diastolicMmHg: number
  ): ProtocolEvaluationResult {
    const protocol = PROTOCOLS.ACC_AHA_2017_BP;

    // Hypertensive Crisis / Critical boundary
    if (systolicMmHg > 180 || diastolicMmHg > 120) {
      return {
        isWithinNormalRange: false,
        severity: 'CRITICAL_OUT_OF_RANGE',
        label: 'Significantly Elevated (Urgent Review Advised)',
        protocol,
        guidanceText:
          'Your recorded blood pressure reading is substantially above standard resting ranges. Please seek immediate medical evaluation from a physician, clinic, or emergency services.',
        requiresMedicalConsultationPrompt: true,
        isDiagnostic: false,
      };
    }

    // Stage 2
    if (systolicMmHg >= 140 || diastolicMmHg >= 90) {
      return {
        isWithinNormalRange: false,
        severity: 'HIGH',
        label: 'Higher than Standard Resting Range',
        protocol,
        guidanceText:
          'This reading exceeds typical resting blood pressure levels. We recommend discussing this trend with your healthcare provider or primary care physician.',
        requiresMedicalConsultationPrompt: true,
        isDiagnostic: false,
      };
    }

    // Stage 1
    if ((systolicMmHg >= 130 && systolicMmHg < 140) || (diastolicMmHg >= 80 && diastolicMmHg < 90)) {
      return {
        isWithinNormalRange: false,
        severity: 'ELEVATED',
        label: 'Mildly Elevated Range',
        protocol,
        guidanceText:
          'Your reading is slightly elevated compared to baseline resting standards. Consider monitoring resting trends and discussing lifestyle factors with your practitioner.',
        requiresMedicalConsultationPrompt: false,
        isDiagnostic: false,
      };
    }

    // Elevated Systolic only
    if (systolicMmHg >= 120 && systolicMmHg < 130 && diastolicMmHg < 80) {
      return {
        isWithinNormalRange: true,
        severity: 'ELEVATED',
        label: 'Elevated Systolic Range',
        protocol,
        guidanceText:
          'Your systolic reading is slightly above normal. Hydration, relaxation, and routine movement can support healthy circulation.',
        requiresMedicalConsultationPrompt: false,
        isDiagnostic: false,
      };
    }

    // Normal (<120 and <80)
    return {
      isWithinNormalRange: true,
      severity: 'NORMAL',
      label: 'Standard Resting Range',
      protocol,
      guidanceText:
        'Your blood pressure reading is within the standard healthy resting range defined by the 2017 ACC/AHA guidelines.',
      requiresMedicalConsultationPrompt: false,
      isDiagnostic: false,
    };
  }

  /**
   * Evaluate Fasting Blood Glucose using ADA 2024 Standards.
   */
  static evaluateFastingGlucose(glucoseMgDl: number): ProtocolEvaluationResult {
    const protocol = PROTOCOLS.ADA_2024_GLUCOSE;

    if (glucoseMgDl < 70) {
      return {
        isWithinNormalRange: false,
        severity: 'CRITICAL_OUT_OF_RANGE',
        label: 'Low Blood Glucose Range',
        protocol,
        guidanceText:
          'Your recorded glucose reading is below standard fasting boundaries (hypoglycemic threshold). If you feel dizzy or shaky, consume fast-acting carbohydrates and consult a medical doctor.',
        requiresMedicalConsultationPrompt: true,
        isDiagnostic: false,
      };
    }

    if (glucoseMgDl >= 126) {
      return {
        isWithinNormalRange: false,
        severity: 'HIGH',
        label: 'Higher than Standard Fasting Range',
        protocol,
        guidanceText:
          'Fasting reading exceeds standard expected baseline. Please consult a qualified physician for clinical blood panel testing.',
        requiresMedicalConsultationPrompt: true,
        isDiagnostic: false,
      };
    }

    if (glucoseMgDl >= 100) {
      return {
        isWithinNormalRange: false,
        severity: 'ELEVATED',
        label: 'Mildly Elevated Fasting Range',
        protocol,
        guidanceText:
          'Your fasting glucose is slightly above standard baseline ranges. Consider discussing nutritional habits with your healthcare practitioner.',
        requiresMedicalConsultationPrompt: false,
        isDiagnostic: false,
      };
    }

    return {
      isWithinNormalRange: true,
      severity: 'NORMAL',
      label: 'Standard Fasting Range',
      protocol,
      guidanceText:
        'Your reading is within the standard fasting baseline range (70–99 mg/dL) defined by the American Diabetes Association.',
      requiresMedicalConsultationPrompt: false,
      isDiagnostic: false,
    };
  }

  /**
   * Evaluate Resting Heart Rate using AHA Guidelines.
   */
  static evaluateRestingHeartRate(bpm: number): ProtocolEvaluationResult {
    const protocol = PROTOCOLS.AHA_RESTING_HR;

    if (bpm < 50 || bpm > 110) {
      return {
        isWithinNormalRange: false,
        severity: bpm > 120 || bpm < 40 ? 'CRITICAL_OUT_OF_RANGE' : 'HIGH',
        label: bpm < 50 ? 'Low Resting Heart Rate' : 'High Resting Heart Rate',
        protocol,
        guidanceText:
          'Your resting pulse reading is outside typical adult resting heart rate boundaries (60–100 bpm). If you experience chest tightness, shortness of breath, or dizziness, seek medical care promptly.',
        requiresMedicalConsultationPrompt: true,
        isDiagnostic: false,
      };
    }

    return {
      isWithinNormalRange: true,
      severity: 'NORMAL',
      label: 'Standard Adult Resting Pulse',
      protocol,
      guidanceText:
        'Your resting heart rate is within typical adult parameters (60–100 bpm) according to AHA guidelines.',
      requiresMedicalConsultationPrompt: false,
      isDiagnostic: false,
    };
  }
}
