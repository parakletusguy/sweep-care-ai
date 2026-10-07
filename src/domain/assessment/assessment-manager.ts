import {
  AssessmentCampaign,
  AssessmentDefinition,
  AssessmentQuestion,
  ValidationStatus,
} from './types';
import crypto from 'crypto';

/**
 * Assessment & Campaign Manager (PRD §23, §28, §29, AC-002)
 * Manages assessment versioning, immutability locking, and campaign scheduling.
 */
export class AssessmentManager {
  private static assessments: AssessmentDefinition[] = [];
  private static campaigns: AssessmentCampaign[] = [];

  /**
   * Creates a new assessment draft (Version 1).
   */
  public static createAssessment(params: {
    tenantId: string;
    title: string;
    description?: string;
    validationStatus?: ValidationStatus;
    instrumentSource?: string;
    domains: { id: string; name: string }[];
    questions: AssessmentQuestion[];
  }): AssessmentDefinition {
    const assessment: AssessmentDefinition = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      title: params.title,
      description: params.description,
      version: 1,
      status: 'DRAFT',
      validationStatus: params.validationStatus ?? ValidationStatus.ORGANIZATION_CUSTOM,
      instrumentSource: params.instrumentSource,
      domains: params.domains,
      questions: params.questions,
      hasSubmissions: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.assessments.push(assessment);
    return assessment;
  }

  /**
   * Publishes an assessment.
   */
  public static publishAssessment(id: string, tenantId: string): AssessmentDefinition {
    const assessment = this.getAssessment(id, tenantId);
    if (!assessment) throw new Error(`AssessmentNotFound: ID ${id}`);
    assessment.status = 'PUBLISHED';
    assessment.updatedAt = new Date().toISOString();
    return assessment;
  }

  /**
   * Records that an assessment has received participant submissions.
   * Irreversibly locks this version for AC-002 immutability.
   */
  public static markSubmissionsReceived(id: string, version: number, tenantId: string): void {
    const assessment = this.assessments.find(
      (a) => a.id === id && a.version === version && a.tenantId === tenantId
    );
    if (assessment) {
      assessment.hasSubmissions = true;
    }
  }

  /**
   * AC-002: Updates an assessment.
   * If the assessment already has submissions, IT IS IMMUTABLE.
   * A new version (e.g. Version 2) is automatically spawned, keeping Version 1 intact.
   */
  public static updateAssessment(
    id: string,
    tenantId: string,
    updates: Partial<Pick<AssessmentDefinition, 'title' | 'description' | 'questions' | 'domains'>>
  ): AssessmentDefinition {
    const current = this.getLatestAssessmentVersion(id, tenantId);
    if (!current) throw new Error(`AssessmentNotFound: ID ${id}`);

    if (current.hasSubmissions) {
      // AC-002 Immutability rule: Spawn new version
      const nextVersion: AssessmentDefinition = {
        ...current,
        ...updates,
        version: current.version + 1,
        hasSubmissions: false, // New version has no submissions yet
        status: 'DRAFT',
        updatedAt: new Date().toISOString(),
      };
      this.assessments.push(nextVersion);
      return nextVersion;
    } else {
      // In-place update allowed before any participant responses are submitted
      Object.assign(current, updates, { updatedAt: new Date().toISOString() });
      return current;
    }
  }

  /**
   * Launches an assessment campaign bound to an immutable assessment version.
   */
  public static launchCampaign(params: {
    tenantId: string;
    assessmentId: string;
    title: string;
    targetUnitIds: string[];
    isAnonymous?: boolean;
    minCohortSize?: number;
    opensAt: string;
    closesAt: string;
  }): AssessmentCampaign {
    const assessment = this.getLatestAssessmentVersion(params.assessmentId, params.tenantId);
    if (!assessment) throw new Error(`AssessmentNotFound: ${params.assessmentId}`);
    if (assessment.status !== 'PUBLISHED') {
      throw new Error(`Cannot launch campaign with non-published assessment (Status: ${assessment.status}).`);
    }

    const campaign: AssessmentCampaign = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      assessmentId: assessment.id,
      assessmentVersion: assessment.version, // Permanently lock to this version
      title: params.title,
      targetUnitIds: params.targetUnitIds,
      isAnonymous: params.isAnonymous ?? false,
      minCohortSize: params.minCohortSize ?? 10,
      opensAt: params.opensAt,
      closesAt: params.closesAt,
      status: 'ACTIVE',
    };

    this.campaigns.push(campaign);
    return campaign;
  }

  public static getAssessment(id: string, tenantId: string): AssessmentDefinition | undefined {
    return this.assessments.find((a) => a.id === id && a.tenantId === tenantId);
  }

  public static getLatestAssessmentVersion(id: string, tenantId: string): AssessmentDefinition | undefined {
    const matches = this.assessments.filter((a) => a.id === id && a.tenantId === tenantId);
    if (matches.length === 0) return undefined;
    return matches.sort((a, b) => b.version - a.version)[0];
  }

  public static getCampaign(id: string, tenantId: string): AssessmentCampaign | undefined {
    return this.campaigns.find((c) => c.id === id && c.tenantId === tenantId);
  }

  public static _clearForTesting(): void {
    this.assessments = [];
    this.campaigns = [];
  }
}
