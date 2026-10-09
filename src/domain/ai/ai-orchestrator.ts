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
    const lower = prompt.normalize('NFKC').toLowerCase();

    // Rule 10: User text is data, never an authority to replace the system or
    // safety instructions. Reject common override and extraction attempts.
    if (
      /ignore (all |any |the )?(previous|prior|above|system|developer) (instruction|prompt|rule)/.test(lower) ||
      /(reveal|show|print|repeat|expose).{0,40}(system prompt|developer message|hidden instruction|chain of thought)/.test(lower) ||
      /\b(jailbreak|do anything now|bypass (the )?(guardrail|safety|policy)|act as (the )?system)\b/.test(lower)
    ) {
      return {
        isSafe: false,
        refusalReason:
          'PromptInjectionDetected: I cannot follow instructions that attempt to override safeguards or expose protected system instructions.',
      };
    }

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

  private static validateGeneratedContent(output: AIInterpretationOutput): string | undefined {
    const generatedText = [
      output.summary,
      ...output.observations,
      ...output.priorityAreas.flatMap((area) => [area.domainName, area.rationale]),
      ...output.suggestedApproaches.flatMap((approach) => [approach.title, approach.description]),
    ]
      .join(' ')
      .toLowerCase();

    if (/\b(you|they|this person) (have|has|are) (depressed|bipolar|schizophrenic)|\bdiagnosis (is|:)|\bprescribe\b/.test(generatedText)) {
      return 'ClinicalBoundaryViolation: AI output must not diagnose, prescribe, or label an individual clinically.';
    }

    if (/\b(fire|terminate|dismiss|discipline) (the |this )?(employee|staff member|person)\b/.test(generatedText)) {
      return 'EmploymentBoundaryViolation: AI output must not make employment or disciplinary recommendations.';
    }
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

    // Rule 10 / PRD §104: defend against unsafe content even if it reached the
    // structured-output layer through a model or retrieval failure.
    const generatedContentError = this.validateGeneratedContent(output);
    if (generatedContentError) {
      return {
        success: false,
        transparencyBadge,
        errors: [generatedContentError],
      };
    }

    // 2. Citation Traceability & Verification (PRD §75 Rule 2, Rule 6, AC-005)
    const allCitationIds: string[] = [];
    for (const approach of output.suggestedApproaches) {
      allCitationIds.push(...approach.citationIds);
    }

    const citationCheck = KnowledgeStore.validateCitationsForTenant(allCitationIds, params.tenantId);
    if (!citationCheck.isValid) {
      return {
        success: false,
        transparencyBadge,
        errors: [
          `AC-005 CitationValidationError: Fabricated or unapproved citation IDs detected: ${citationCheck.unverifiedIds.join(', ')}`,
        ],
      };
    }

    // Every source named in the evidence section must be a verified citation,
    // and its human-readable metadata must agree with the approved record.
    const citationIds = new Set(allCitationIds);
    const evidenceIds = new Set(output.evidence.map((item) => item.sourceId));
    const missingEvidence = [...citationIds].filter((id) => !evidenceIds.has(id));
    const unsupportedEvidence = [...evidenceIds].filter((id) => !citationIds.has(id));
    const mismatchedEvidence = output.evidence
      .filter((item) => {
        const source = citationCheck.verifiedSources.find((verified) => verified.id === item.sourceId);
        return !source || source.title !== item.sourceTitle || source.publisher !== item.publisher;
      })
      .map((item) => item.sourceId);

    if (missingEvidence.length || unsupportedEvidence.length || mismatchedEvidence.length) {
      return {
        success: false,
        transparencyBadge,
        errors: [
          `AC-005 EvidenceTraceabilityError: missing=${missingEvidence.join(', ') || 'none'}; unsupported=${unsupportedEvidence.join(', ') || 'none'}; mismatched=${mismatchedEvidence.join(', ') || 'none'}.`,
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
