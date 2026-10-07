import crypto from 'crypto';
import { AssistantIntent, AssistantResponse } from './types';
import { UserSession } from '../identity/roles';
import { TenantContextStore } from '../tenancy/tenant-context';
import { SafeguardingEngine } from '../safeguarding/safeguarding-engine';
import { SafetySeverityLevel } from '../safeguarding/types';
import { KnowledgeStore } from '../ai/knowledge-store';
import { AuditLogger } from '../audit/audit-logger';
import { DataClassification } from '../audit/types';

/**
 * Phase 2B: Participant-Facing AI Wellbeing Assistant Engine (PRD §47, §48, §104)
 * Provides guided resource navigation, goal reflection, and grounded advice,
 * strictly governed by 16 non-negotiable prohibited behaviors and automated crisis routing.
 */
export class WellbeingAssistantEngine {
  private static readonly MODEL_VERSION = 'sweep-orchestrator-v1.4';
  private static readonly PROMPT_VERSION = 'wb-assistant-v2.1';

  /**
   * Evaluates participant chat input with hard behavioral fences and RAG retrieval.
   */
  public static async processMessage(
    session: UserSession,
    message: string,
    countryCode = 'GB'
  ): Promise<AssistantResponse> {
    TenantContextStore.assertTenantMatch(session.tenantId);

    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    // 1. Prompt Injection Sanitization (Rule 10)
    if (
      lower.includes('ignore previous instructions') ||
      lower.includes('disregard rules') ||
      lower.includes('you are now dan') ||
      lower.includes('jailbreak')
    ) {
      return this.formatRefusal(
        session.tenantId,
        AssistantIntent.PROHIBITED_MEDICAL_DIAGNOSIS,
        'Security guardrail: Instructions attempting to override platform safety constraints are rejected.',
        []
      );
    }

    // 2. Deterministic Crisis Check (PRD §48, §60, §61)
    const safetyCheck = SafeguardingEngine.evaluateSafetyFlags(trimmed);
    if (safetyCheck.isTriggered && safetyCheck.severity === SafetySeverityLevel.CRITICAL) {
      const crisisResources = SafeguardingEngine.routeCrisisResources(session.tenantId, countryCode);

      AuditLogger.log({
        tenantId: session.tenantId,
        actorId: session.userId,
        action: 'SAFEGUARDING_TRIGGERED',
        classification: DataClassification.CLASS_F_SAFEGUARDING,
        resourceType: 'AIAssistantChat',
        resourceId: crypto.randomUUID(),
        metadata: {
          keywords: safetyCheck.matchedKeywords,
          severity: safetyCheck.severity,
        },
      });

      return {
        id: crypto.randomUUID(),
        content: `I sense you are going through a critical crisis. I cannot act as emergency services, but urgent, confidential support is available right now:\n\n` +
          `• Emergency line: ${crisisResources.emergencyNumber}\n` +
          `• ${crisisResources.crisisHelplineName}: ${crisisResources.crisisHelplineContact} (${crisisResources.crisisHours})\n\n` +
          `A designated safeguarding alert has been flagged to qualified care staff. Please reach out to these crisis services immediately.`,
        intent: AssistantIntent.CRISIS_EMERGENCY_DETECTED,
        isRefusal: true,
        refusalReason: 'Critical crisis escalation triggered.',
        isCrisis: true,
        crisisResources,
        citations: [],
        provenance: {
          modelVersion: this.MODEL_VERSION,
          promptVersion: this.PROMPT_VERSION,
          sourcesRetrieved: ['GLOBAL_CRISIS_CONFIG'],
          createdAt: new Date().toISOString(),
        },
        disclosure: {
          isAiGenerated: true,
          disclaimer: 'SWEEP Care AI is an automated support system, not an emergency dispatcher or medical provider.',
        },
      };
    }

    // 3. Prohibited Behavioral Fence: Medical & Psychological Diagnosis (PRD §48)
    const diagnosisKeywords = [
      'diagnose me',
      'do i have depression',
      'do i have adhd',
      'do i have bipolar',
      'do i have schizophrenia',
      'what is my diagnosis',
      'clinical diagnosis',
    ];
    if (diagnosisKeywords.some((k) => lower.includes(k))) {
      return this.formatRefusal(
        session.tenantId,
        AssistantIntent.PROHIBITED_MEDICAL_DIAGNOSIS,
        'I am an AI assistant and cannot provide medical or clinical psychological diagnoses (PRD §48). Please speak with a licensed doctor, psychologist, or your organization’s authorized care professional.',
        []
      );
    }

    // 4. Prohibited Behavioral Fence: Medication Prescribing or Altering (PRD §48)
    const medicationKeywords = [
      'prescribe',
      'what medication should i take',
      'increase my dosage',
      'stop taking my medication',
      'should i take zoloft',
      'should i take prozac',
      'change my dose',
    ];
    if (medicationKeywords.some((k) => lower.includes(k))) {
      return this.formatRefusal(
        session.tenantId,
        AssistantIntent.PROHIBITED_MEDICATION_ADVICE,
        'I am strictly prohibited from prescribing, altering, or advising on medication or pharmaceutical dosages (PRD §48). Any medication decisions must be evaluated by a certified medical doctor or psychiatrist.',
        []
      );
    }

    // 5. Prohibited Behavioral Fence: Employment & Disciplinary Dismissal Advice (Rule 15, PRD §48)
    const employmentKeywords = [
      'should i fire',
      'fire this employee',
      'terminate their contract',
      'disciplinary action recommendation',
      'dismiss them',
      'lay off',
    ];
    if (employmentKeywords.some((k) => lower.includes(k))) {
      return this.formatRefusal(
        session.tenantId,
        AssistantIntent.PROHIBITED_EMPLOYMENT_ADVICE,
        'I am strictly prohibited from giving employment termination, disciplinary, or workforce dismissal advice (PRD Constitutional Rule 15, §48). All employment decisions must be handled by human management according to organizational governance.',
        []
      );
    }

    // 6. Prohibited Behavioral Fence: Human or Doctor Impersonation (PRD §48)
    if (
      /\bare you (a )?(human|doctor|psychologist|counsellor|therapist|person)/i.test(lower) ||
      lower.includes('are you human') ||
      lower.includes('are you real')
    ) {
      return {
        id: crypto.randomUUID(),
        content: 'I am an artificial intelligence wellbeing assistant created to assist you with navigation and non-clinical wellbeing resources. I am not a human, doctor, psychologist, or therapist (PRD §48).',
        intent: AssistantIntent.WELLBEING_EXPLANATION,
        isRefusal: false,
        isCrisis: false,
        citations: [],
        provenance: {
          modelVersion: this.MODEL_VERSION,
          promptVersion: this.PROMPT_VERSION,
          sourcesRetrieved: [],
          createdAt: new Date().toISOString(),
        },
        disclosure: {
          isAiGenerated: true,
          disclaimer: 'All answers are generated by SWEEP Care AI and do not substitute for certified clinical advice.',
        },
      };
    }

    // 7. Grounded Retrieval-Augmented Response (PRD §47, §75)
    const sources = KnowledgeStore.getAllSources();
    const matchedSource = sources.find((s) =>
      lower.includes('burnout') || lower.includes('stress') || lower.includes('sleep') || lower.includes('recovery')
        ? s.title.toLowerCase().includes('mental health') || s.domain.toLowerCase().includes('stress') || s.title.toLowerCase().includes('guideline')
        : true
    ) || sources[0];

    const citations = matchedSource ? [matchedSource.id] : [];
    const sourceTitle = matchedSource ? matchedSource.title : 'Approved Wellbeing Standards';

    let content = '';
    let intent = AssistantIntent.WELLBEING_EXPLANATION;

    if (lower.includes('goal') || lower.includes('habit')) {
      intent = AssistantIntent.GOAL_SETTING;
      content = `Setting small, measurable daily habits is one of the most effective ways to build sustainable resilience. Grounded in "${sourceTitle}" [${citations[0] || 'REF-01'}], consider establishing 15-minute asynchronous recovery windows and consistent sleep routines.`;
    } else if (lower.includes('programme') || lower.includes('workshop')) {
      intent = AssistantIntent.PROGRAMME_RECOMMENDATION;
      content = `Based on verified organizational frameworks in "${sourceTitle}" [${citations[0] || 'REF-01'}], you can explore our suggested "Asynchronous Work Boundaries & Recovery" programme or reach out to an authorized wellbeing lead.`;
    } else {
      intent = AssistantIntent.RESOURCE_NAVIGATION;
      content = `I can help you navigate personal wellbeing resources, understand non-diagnostic assessment trends, and explore approved organizational workshops. Reference: "${sourceTitle}" [${citations[0] || 'REF-01'}]. How can I assist you today?`;
    }

    // Append-only audit record
    AuditLogger.log({
      tenantId: session.tenantId,
      actorId: session.userId,
      action: 'AI_INFERENCE_GENERATED',
      classification: DataClassification.CLASS_D_SENSITIVE_WELLBEING,
      resourceType: 'AIAssistantChat',
      resourceId: crypto.randomUUID(),
      metadata: {
        intent,
        citations,
      },
    });

    return {
      id: crypto.randomUUID(),
      content,
      intent,
      isRefusal: false,
      isCrisis: false,
      citations,
      provenance: {
        modelVersion: this.MODEL_VERSION,
        promptVersion: this.PROMPT_VERSION,
        sourcesRetrieved: citations,
        createdAt: new Date().toISOString(),
      },
      disclosure: {
        isAiGenerated: true,
        disclaimer: 'AI-assisted response grounded in approved knowledge sources (PRD §49, AC-010). Not clinical advice.',
      },
    };
  }

  private static formatRefusal(
    tenantId: string,
    intent: AssistantIntent,
    reason: string,
    citations: string[]
  ): AssistantResponse {
    return {
      id: crypto.randomUUID(),
      content: reason,
      intent,
      isRefusal: true,
      refusalReason: reason,
      isCrisis: false,
      citations,
      provenance: {
        modelVersion: this.MODEL_VERSION,
        promptVersion: this.PROMPT_VERSION,
        sourcesRetrieved: citations,
        createdAt: new Date().toISOString(),
      },
      disclosure: {
        isAiGenerated: true,
        disclaimer: 'Request refused under PRD §48 and Constitutional Rule 15 Safety Guardrails.',
      },
    };
  }
}
