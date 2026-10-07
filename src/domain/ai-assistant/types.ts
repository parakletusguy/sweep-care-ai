import { CrisisResourceConfig } from '../safeguarding/types';

/**
 * Phase 2B: Participant-Facing AI Wellbeing Assistant Types (PRD §47, §48, §104)
 */
export enum AssistantIntent {
  RESOURCE_NAVIGATION = 'RESOURCE_NAVIGATION',
  GOAL_SETTING = 'GOAL_SETTING',
  WELLBEING_EXPLANATION = 'WELLBEING_EXPLANATION',
  PROGRAMME_RECOMMENDATION = 'PROGRAMME_RECOMMENDATION',
  PROHIBITED_MEDICAL_DIAGNOSIS = 'PROHIBITED_MEDICAL_DIAGNOSIS',
  PROHIBITED_MEDICATION_ADVICE = 'PROHIBITED_MEDICATION_ADVICE',
  PROHIBITED_EMPLOYMENT_ADVICE = 'PROHIBITED_EMPLOYMENT_ADVICE',
  CRISIS_EMERGENCY_DETECTED = 'CRISIS_EMERGENCY_DETECTED',
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface AssistantResponse {
  id: string;
  content: string;
  intent: AssistantIntent;
  isRefusal: boolean;
  refusalReason?: string;
  isCrisis: boolean;
  crisisResources?: CrisisResourceConfig;
  citations: string[];
  provenance: {
    modelVersion: string;
    promptVersion: string;
    sourcesRetrieved: string[];
    createdAt: string;
  };
  disclosure: {
    isAiGenerated: true;
    disclaimer: string;
  };
}
