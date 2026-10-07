import { ProgrammeDefinition, ProgrammeSession, ProgrammeState } from './types';
import { UserSession } from '../identity/roles';
import { AccessControl, Permission } from '../identity/permissions';
import crypto from 'crypto';

/**
 * Programme Lifecycle & Approval Gate Manager (PRD §39, §40, §43, AC-006)
 * Enforces mandatory human approval before any AI-generated programme can become active.
 */
export class ProgrammeManager {
  private static programmes: ProgrammeDefinition[] = [];

  /**
   * Generates a structured AI programme draft from population findings (PRD §39, §40).
   * Strictly starts in DRAFT state with SUGGESTED_APPROACH classification.
   */
  public static createAiDraft(params: {
    tenantId: string;
    title: string;
    problemStatement: string;
    targetPopulation: string;
    objectives: string[];
    sessions: ProgrammeSession[];
    supportingKnowledgeSourceIds: string[];
    baselineAssessmentId?: string;
  }): ProgrammeDefinition {
    const programme: ProgrammeDefinition = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      title: params.title,
      problemStatement: params.problemStatement,
      targetPopulation: params.targetPopulation,
      objectives: params.objectives,
      sessions: params.sessions,
      state: ProgrammeState.DRAFT, // PRD §43: AI programmes start in DRAFT
      isAiGenerated: true,
      wordingClassification: 'SUGGESTED_APPROACH', // PRD §40 guardrail
      supportingKnowledgeSourceIds: params.supportingKnowledgeSourceIds,
      baselineAssessmentId: params.baselineAssessmentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.programmes.push(programme);
    return programme;
  }

  /**
   * Submits a programme for qualified human review.
   */
  public static submitForReview(id: string, tenantId: string): ProgrammeDefinition {
    const p = this.getProgramme(id, tenantId);
    if (!p) throw new Error(`ProgrammeNotFound: ID ${id}`);
    if (p.state !== ProgrammeState.DRAFT) {
      throw new Error(`InvalidStateTransition: Can only submit DRAFT programmes for review (Current: ${p.state}).`);
    }

    p.state = ProgrammeState.UNDER_REVIEW;
    p.updatedAt = new Date().toISOString();
    return p;
  }

  /**
   * AC-006: Human Approval Gate
   * Requires an authenticated session with APPROVE_PROGRAMME permission (Wellbeing Pro or Org Admin).
   */
  public static approveProgramme(id: string, reviewerSession: UserSession): ProgrammeDefinition {
    // Assert authorization (AC-006)
    AccessControl.assertPermission(reviewerSession, Permission.APPROVE_PROGRAMME);

    const p = this.getProgramme(id, reviewerSession.tenantId);
    if (!p) throw new Error(`ProgrammeNotFound: ID ${id}`);

    if (p.state !== ProgrammeState.UNDER_REVIEW && p.state !== ProgrammeState.DRAFT) {
      throw new Error(`InvalidStateTransition: Cannot approve programme in state ${p.state}.`);
    }

    p.state = ProgrammeState.APPROVED;
    p.humanApprovedById = reviewerSession.userId;
    p.humanApprovedAt = new Date().toISOString();
    p.updatedAt = new Date().toISOString();

    return p;
  }

  /**
   * AC-006: Activates a programme.
   * Throws an error if programme is still in DRAFT or UNDER_REVIEW.
   */
  public static activateProgramme(id: string, tenantId: string): ProgrammeDefinition {
    const p = this.getProgramme(id, tenantId);
    if (!p) throw new Error(`ProgrammeNotFound: ID ${id}`);

    // AC-006 Human review check
    if (p.state !== ProgrammeState.APPROVED && p.state !== ProgrammeState.SCHEDULED) {
      throw new Error(
        `AC-006 ApprovalViolation: Programme ${id} cannot be activated without human approval (Current state: ${p.state}).`
      );
    }

    p.state = ProgrammeState.ACTIVE;
    p.updatedAt = new Date().toISOString();
    return p;
  }

  public static getProgramme(id: string, tenantId: string): ProgrammeDefinition | undefined {
    return this.programmes.find((p) => p.id === id && p.tenantId === tenantId);
  }

  public static _clearForTesting(): void {
    this.programmes = [];
  }
}
