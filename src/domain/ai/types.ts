import { z } from 'zod';

/**
 * PRD §74: AI Task Classification
 */
export enum TaskRiskLevel {
  LOW = 'LOW', // Rewriting descriptions, generic summaries
  MODERATE = 'MODERATE', // Group assessment findings, programme drafts
  HIGH = 'HIGH', // Individual recommendations, safeguarding, health interpretations
}

/**
 * PRD §76: Approved Knowledge Source
 */
export interface KnowledgeSource {
  id: string;
  tenantId?: string; // Optional: Global vs Tenant-specific
  title: string;
  publisher: string; // e.g., 'World Health Organization', 'NICE', 'ISO'
  url?: string;
  publishedDate?: string;
  jurisdiction?: string;
  domain: string; // e.g., 'Workplace Stress', 'Sleep', 'Belonging'
  status: 'APPROVED' | 'UNDER_REVIEW' | 'EXPIRED' | 'REVOKED';
  keyFindings: string[];
}

/**
 * PRD §75 Rule 5: Structured Schema for AI Interpretation & Recommendations
 */
export const AIInterpretationOutputSchema = z.object({
  summary: z.string().min(1),
  observations: z.array(z.string()),
  priorityAreas: z.array(
    z.object({
      domainId: z.string(),
      domainName: z.string(),
      rationale: z.string(),
    })
  ),
  suggestedApproaches: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      wordingType: z.literal('SUGGESTED_APPROACH'),
      citationIds: z.array(z.string()),
    })
  ),
  evidence: z.array(
    z.object({
      sourceId: z.string(),
      sourceTitle: z.string(),
      publisher: z.string(),
    })
  ),
  limitations: z.array(z.string()),
  requiresHumanReview: z.literal(true), // PRD §78
});

export type AIInterpretationOutput = z.infer<typeof AIInterpretationOutputSchema>;

/**
 * PRD §57, AC-004: AI Provenance Record
 */
export interface AIArtifactRecord {
  id: string;
  tenantId: string;
  taskType: 'ASSESSMENT_INTERPRETATION' | 'PROGRAMME_DESIGN' | 'RESOURCE_MATCHING';
  riskLevel: TaskRiskLevel;
  modelVersion: string;
  promptVersion: string;
  knowledgeSourceIds: string[];
  outputHash: string;
  status: 'AI_DRAFT' | 'REVIEW_REQUIRED' | 'HUMAN_APPROVED' | 'HUMAN_REJECTED';
  rawOutput: string;
  createdAt: string;
}

/**
 * PRD §49, AC-010: AI Transparency Disclosures
 */
export interface AITransparencyBadge {
  isAiGenerated: true;
  label: string; // "SWEEP Care AI Assistant"
  disclaimer: string;
  modelIdentifier: string;
}
