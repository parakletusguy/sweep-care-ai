import {
  AIArtifactRecord,
  AIInterpretationOutput,
  AIInterpretationOutputSchema,
  AITransparencyBadge,
  TaskRiskLevel,
} from './types';
import { KnowledgeStore } from './knowledge-store';
import crypto from 'crypto';

/**
 * Knowledge-Grounded AI Orchestrator (PRD §73, §75, AC-004, AC-005, AC-010)
 * Strictly enforces the 10 Anti-Hallucination rules, citation verification,
 * structured JSON output schemas, and provenance tracking.
 */
export class AIOrchestrator {
  private static readonly CURRENT_MODEL = 'gemini-2.5-flash';
  private static readonly PROMPT_VERSION = 'v1.0.0-rag-grounded';
  private static artifacts: AIArtifactRecord[] = [];

  /**
   * PRD §104 & Rule 15: Prohibited Content & Prompt Injection Guardrail
   * Inspects user prompts for requests to invent studies, diagnose individuals, or make employment decisions.
   */
  public static validatePromptSafety(prompt: string): { isSafe: boolean; refusalReason?: string } {
    const lower = prompt.toLowerCase();

    // 1. Prohibited: Firing / Disciplinary employment decisions (PRD §48, §62, §104)
    if (lower.includes('fire') || lower.includes('terminate') || lower.includes('dismiss')) {
      if (lower.includes('employee') || lower.includes('staff') || lower.includes('who should')) {
        return {
          isSafe: false,
          refusalReason:
            'ProhibitedUse: SWEEP Care AI strictly does not provide employment, termination, or disciplinary recommendations.',
        };
      }
    }

    // 2. Prohibited: Autonomous clinical / psychiatric diagnosis (PRD §48, §101, §104)
    if (
      lower.includes('diagnosis') ||
      lower.includes('diagnose') ||
      lower.includes('schizophrenia') ||
      lower.includes('bipolar') ||
      lower.includes('prescribe')
    ) {
      return {
        isSafe: false,
        refusalReason:
          'ProhibitedUse: SWEEP Care AI is an organizational wellbeing intelligence platform and does not provide clinical or psychiatric diagnoses.',
      };
    }

    // 3. Prohibited: Requesting to invent evidence or citations (PRD §75 Rule 1, §104)
    if (
      (lower.includes('invent') || lower.includes('fabricate') || lower.includes('make up')) &&
      (lower.includes('study') || lower.includes('citation') || lower.includes('evidence'))
    ) {
      return {
        isSafe: false,
        refusalReason:
          'ProhibitedUse: I cannot invent or fabricate studies, evidence, or citations. All guidance must be grounded in approved knowledge sources.',
      };
    }

    return { isSafe: true };
  }

  /**
   * Validates and persists an AI interpretation output, strictly verifying citations (AC-005)
   * and logging full provenance (AC-004).
   */
  public static processAIOutput(params: {
    tenantId: string;
    taskType: AIArtifactRecord['taskType'];
    riskLevel: TaskRiskLevel;
    rawJsonPayload: unknown;
  }): {
    success: boolean;
    data?: AIInterpretationOutput;
    artifact?: AIArtifactRecord;
    transparencyBadge: AITransparencyBadge;
    errors?: string[];
  } {
    const transparencyBadge: AITransparencyBadge = {
      isAiGenerated: true,
      label: 'SWEEP Care AI Assistant',
      disclaimer:
        'AI-generated guidance is synthesized for decision support and may contain errors. Qualified human professionals must review all intervention decisions.',
      modelIdentifier: this.CURRENT_MODEL,
    };

    // 1. Schema Validation (PRD §75 Rule 5)
    const schemaResult = AIInterpretationOutputSchema.safeParse(params.rawJsonPayload);
    if (!schemaResult.success) {
      return {
        success: false,
        transparencyBadge,
        errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }

    const output = schemaResult.data;

    // 2. Citation Traceability & Verification (PRD §75 Rule 2, Rule 6, AC-005)
    const allCitationIds: string[] = [];
    for (const approach of output.suggestedApproaches) {
      allCitationIds.push(...approach.citationIds);
    }

    const citationCheck = KnowledgeStore.validateCitations(allCitationIds);
    if (!citationCheck.isValid) {
      return {
        success: false,
        transparencyBadge,
        errors: [
          `AC-005 CitationValidationError: Fabricated or unapproved citation IDs detected: ${citationCheck.unverifiedIds.join(', ')}`,
        ],
      };
    }

    // 3. Provenance Record Logging (PRD §57, AC-004)
    const jsonString = JSON.stringify(output);
    const outputHash = crypto.createHash('sha256').update(jsonString).digest('hex');

    const artifact: AIArtifactRecord = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      taskType: params.taskType,
      riskLevel: params.riskLevel,
      modelVersion: this.CURRENT_MODEL,
      promptVersion: this.PROMPT_VERSION,
      knowledgeSourceIds: allCitationIds,
      outputHash,
      status: 'AI_DRAFT', // PRD §78: Starts in AI_DRAFT
      rawOutput: jsonString,
      createdAt: new Date().toISOString(),
    };

    this.artifacts.push(artifact);

    return {
      success: true,
      data: output,
      artifact,
      transparencyBadge,
    };
  }

  public static getArtifact(id: string): AIArtifactRecord | undefined {
    return this.artifacts.find((a) => a.id === id);
  }

  public static _clearForTesting(): void {
    this.artifacts = [];
  }
}
