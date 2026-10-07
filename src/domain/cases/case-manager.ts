import crypto from 'crypto';
import {
  Case,
  CaseNote,
  CasePriority,
  CaseStatus,
  Referral,
  ReferralStatus,
  ReferralType,
} from './types';
import { UserSession, Role } from '../identity/roles';
import { AccessControl, Permission } from '../identity/permissions';
import { AuditLogger } from '../audit/audit-logger';
import { DataClassification } from '../audit/types';
import { TenantContextStore } from '../tenancy/tenant-context';

/**
 * Phase 2A: Professional Case & Referral Manager (PRD §13, §14, §17, §55, §56, AC-007, AC-009)
 * Handles confidential participant case management, encrypted case notes,
 * and multi-stage referral pipelines strictly isolated from HR managers and unauthorized roles.
 */
export class CaseManager {
  private static cases: Case[] = [];

  /**
   * Opens a new confidential care case for a participant.
   */
  public static createCase(
    session: UserSession,
    params: {
      tenantId: string;
      participantId: string;
      title: string;
      description: string;
      priority?: CasePriority;
      classification?: DataClassification;
      assignedProfessionalId?: string;
      safeguardingEventId?: string;
      assessmentSubmissionId?: string;
    }
  ): Case {
    // 1. Enforce tenant boundary (AC-001)
    TenantContextStore.assertTenantMatch(params.tenantId);

    // 2. Enforce RBAC permission
    AccessControl.assertPermission(session, Permission.MANAGE_CASES);

    const classification = params.classification || DataClassification.CLASS_D_SENSITIVE_WELLBEING;

    // 3. Assert access to classification
    AccessControl.assertCanAccessCase(session, classification, params.assignedProfessionalId);

    const newCase: Case = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      participantId: params.participantId,
      title: params.title,
      description: params.description,
      status: CaseStatus.OPEN,
      priority: params.priority || CasePriority.ROUTINE,
      classification,
      assignedProfessionalId: params.assignedProfessionalId || session.userId,
      openedById: session.userId,
      safeguardingEventId: params.safeguardingEventId,
      assessmentSubmissionId: params.assessmentSubmissionId,
      notes: [],
      referrals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cases.push(newCase);

    // 4. Record audit event (PRD §85, AC-009)
    AuditLogger.log({
      tenantId: params.tenantId,
      actorId: session.userId,
      action: 'CREATE',
      classification,
      resourceType: 'Case',
      resourceId: newCase.id,
      metadata: {
        participantId: params.participantId,
        priority: newCase.priority,
        title: newCase.title,
      },
    });

    return newCase;
  }

  /**
   * Retrieves a case by ID with strict role checking and audit logging.
   */
  public static getCase(session: UserSession, caseId: string): Case {
    const foundCase = this.cases.find((c) => c.id === caseId);
    if (!foundCase) {
      throw new Error(`CaseNotFound: Case with ID ${caseId} does not exist.`);
    }

    // 1. Enforce tenant isolation (AC-001)
    TenantContextStore.assertTenantMatch(foundCase.tenantId);

    // 2. Enforce access control (AC-007)
    AccessControl.assertCanAccessCase(session, foundCase.classification, foundCase.assignedProfessionalId);

    // 3. Log audit event on read of Class D or Class F record (AC-009)
    AuditLogger.log({
      tenantId: foundCase.tenantId,
      actorId: session.userId,
      action: 'READ',
      classification: foundCase.classification,
      resourceType: 'Case',
      resourceId: foundCase.id,
    });

    return foundCase;
  }

  /**
   * Lists cases accessible to the authenticated professional.
   */
  public static listCasesForSession(session: UserSession): Case[] {
    const currentTenantId = TenantContextStore.getCurrentTenantId();

    // HR is strictly blocked from listing individual cases
    if (session.role === Role.HR_MANAGER) {
      throw new Error(
        `Forbidden: Role ${session.role} cannot view individual participant cases (PRD §14, AC-007).`
      );
    }

    return this.cases.filter((c) => {
      if (c.tenantId !== currentTenantId) return false;
      return AccessControl.canAccessCase(session, c.classification, c.assignedProfessionalId);
    });
  }

  /**
   * Appends a confidential case note.
   */
  public static addCaseNote(
    session: UserSession,
    caseId: string,
    params: {
      content: string;
      isConfidential?: boolean;
      classificationOverride?: DataClassification;
    }
  ): CaseNote {
    const targetCase = this.getCase(session, caseId);

    // Enforce permission
    AccessControl.assertPermission(session, Permission.VIEW_CONFIDENTIAL_NOTES);

    const noteClassification =
      params.classificationOverride || targetCase.classification;

    const note: CaseNote = {
      id: crypto.randomUUID(),
      caseId: targetCase.id,
      tenantId: targetCase.tenantId,
      authorId: session.userId,
      authorRole: session.role,
      content: params.content,
      classification: noteClassification,
      isConfidential: params.isConfidential ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    targetCase.notes.push(note);
    targetCase.updatedAt = new Date().toISOString();

    // Update case status if in initial OPEN state
    if (targetCase.status === CaseStatus.OPEN) {
      targetCase.status = CaseStatus.ACTIVE_SUPPORT;
    }

    // Append-only audit record (AC-009)
    AuditLogger.log({
      tenantId: targetCase.tenantId,
      actorId: session.userId,
      action: 'CREATE',
      classification: noteClassification,
      resourceType: 'CaseNote',
      resourceId: note.id,
      metadata: {
        caseId: targetCase.id,
        isConfidential: note.isConfidential,
      },
    });

    return note;
  }

  /**
   * Initiates a referral for a participant in a case.
   */
  public static createReferral(
    session: UserSession,
    caseId: string,
    params: {
      type: ReferralType;
      providerName: string;
      reason: string;
      externalContactInfo?: string;
      notes?: string;
      assignedProfessionalId?: string;
    }
  ): Referral {
    const targetCase = this.getCase(session, caseId);

    AccessControl.assertPermission(session, Permission.CREATE_REFERRAL);

    const referral: Referral = {
      id: crypto.randomUUID(),
      caseId: targetCase.id,
      tenantId: targetCase.tenantId,
      participantId: targetCase.participantId,
      referredById: session.userId,
      assignedProfessionalId: params.assignedProfessionalId,
      type: params.type,
      status: ReferralStatus.PENDING_REVIEW,
      providerName: params.providerName,
      externalContactInfo: params.externalContactInfo,
      reason: params.reason,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    targetCase.referrals.push(referral);
    targetCase.status = CaseStatus.REFERRED;
    targetCase.updatedAt = new Date().toISOString();

    // Audit log
    AuditLogger.log({
      tenantId: targetCase.tenantId,
      actorId: session.userId,
      action: 'CREATE',
      classification: targetCase.classification,
      resourceType: 'Referral',
      resourceId: referral.id,
      metadata: {
        caseId: targetCase.id,
        referralType: referral.type,
        provider: referral.providerName,
      },
    });

    return referral;
  }

  /**
   * Advances the referral lifecycle through structured stages.
   */
  public static updateReferralStatus(
    session: UserSession,
    caseId: string,
    referralId: string,
    newStatus: ReferralStatus
  ): Referral {
    const targetCase = this.getCase(session, caseId);
    AccessControl.assertPermission(session, Permission.MANAGE_CASES);

    const referral = targetCase.referrals.find((r) => r.id === referralId);
    if (!referral) {
      throw new Error(`ReferralNotFound: Referral ${referralId} not found in case ${caseId}.`);
    }

    // Disallow transitions from terminal states
    if (
      referral.status === ReferralStatus.COMPLETED ||
      referral.status === ReferralStatus.CANCELLED ||
      referral.status === ReferralStatus.DECLINED
    ) {
      throw new Error(
        `InvalidReferralTransition: Cannot transition referral from terminal state ${referral.status}.`
      );
    }

    referral.status = newStatus;
    referral.updatedAt = new Date().toISOString();
    if (newStatus === ReferralStatus.COMPLETED) {
      referral.completedAt = new Date().toISOString();
    }

    targetCase.updatedAt = new Date().toISOString();

    AuditLogger.log({
      tenantId: targetCase.tenantId,
      actorId: session.userId,
      action: 'UPDATE',
      classification: targetCase.classification,
      resourceType: 'Referral',
      resourceId: referral.id,
      metadata: {
        newStatus,
        caseId: targetCase.id,
      },
    });

    return referral;
  }

  /**
   * Closes a case with formal reason tracking.
   */
  public static closeCase(
    session: UserSession,
    caseId: string,
    resolutionReason: string
  ): Case {
    const targetCase = this.getCase(session, caseId);
    AccessControl.assertPermission(session, Permission.MANAGE_CASES);

    targetCase.status = CaseStatus.CLOSED;
    targetCase.closedAt = new Date().toISOString();
    targetCase.updatedAt = new Date().toISOString();

    // Add administrative closing note
    targetCase.notes.push({
      id: crypto.randomUUID(),
      caseId: targetCase.id,
      tenantId: targetCase.tenantId,
      authorId: session.userId,
      authorRole: session.role,
      content: `Case closed. Resolution reason: ${resolutionReason}`,
      classification: targetCase.classification,
      isConfidential: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    AuditLogger.log({
      tenantId: targetCase.tenantId,
      actorId: session.userId,
      action: 'UPDATE',
      classification: targetCase.classification,
      resourceType: 'Case',
      resourceId: targetCase.id,
      metadata: {
        action: 'CLOSE',
        resolutionReason,
      },
    });

    return targetCase;
  }

  /**
   * Clears internal state (for testing only).
   */
  public static _clearForTesting(): void {
    this.cases = [];
  }
}
