import { CrisisResourceConfig, SafeguardingEvent, SafetySeverityLevel } from './types';
import { AuditLogger } from '../audit/audit-logger';
import { DataClassification } from '../audit/types';
import { Role, UserSession } from '../identity/roles';
import crypto from 'crypto';

/**
 * Safeguarding & Crisis Escalation Engine (PRD §60, §61)
 * Enforces deterministic crisis trigger detection, regional helpline routing,
 * and Class F data isolation.
 */
export class SafeguardingEngine {
  private static crisisConfigs: Map<string, CrisisResourceConfig[]> = new Map();
  private static events: SafeguardingEvent[] = [];

  // Deterministic critical safety patterns (zero-LLM dependency for life safety)
  private static readonly CRITICAL_PATTERNS = [
    /\b(suicide|kill myself|end my life|want to die|self-harm|cutting myself)\b/i,
    /\b(being beaten|physically abused|assaulted by)\b/i,
  ];

  public static registerCrisisConfig(config: CrisisResourceConfig): void {
    const list = this.crisisConfigs.get(config.tenantId) || [];
    list.push(config);
    this.crisisConfigs.set(config.tenantId, list);
  }

  /**
   * Deterministic safety classification for chat and free-text triage (PRD §48, §60).
   */
  public static evaluateSafetyFlags(textInput: string): {
    isTriggered: boolean;
    severity: SafetySeverityLevel;
    matchedKeywords: string[];
  } {
    const matchedKeywords: string[] = [];
    for (const pattern of this.CRITICAL_PATTERNS) {
      const match = textInput.match(pattern);
      if (match) {
        matchedKeywords.push(match[0].toLowerCase());
      }
    }
    return {
      isTriggered: matchedKeywords.length > 0,
      severity: matchedKeywords.length > 0 ? SafetySeverityLevel.CRITICAL : SafetySeverityLevel.LOW,
      matchedKeywords: Array.from(new Set(matchedKeywords)),
    };
  }

  /**
   * Resolves regional crisis resources or falls back to standard regional configurations (PRD §61).
   */
  public static routeCrisisResources(tenantId: string, countryCode = 'GB'): CrisisResourceConfig {
    const found = this.resolveCrisisResources(tenantId, countryCode);
    if (found) return found;

    if (countryCode.toUpperCase() === 'US') {
      return {
        tenantId,
        countryCode: 'US',
        emergencyNumber: '911',
        crisisHelplineName: 'Suicide & Crisis Lifeline',
        crisisHelplineContact: '988',
        crisisHours: '24/7 Free & Confidential',
      };
    }

    return {
      tenantId,
      countryCode: 'GB',
      emergencyNumber: '999',
      crisisHelplineName: 'Samaritans',
      crisisHelplineContact: '116 123',
      crisisHours: '24/7 Free & Confidential',
    };
  }

  /**
   * Evaluates text response deterministically against safety rules (PRD §60).
   */
  public static evaluateInput(params: {
    tenantId: string;
    participantId: string;
    textInput: string;
    assessmentId?: string;
    questionId?: string;
  }): { isFlagged: boolean; event?: SafeguardingEvent; crisisResources: CrisisResourceConfig | null } {
    const matchedKeywords: string[] = [];

    for (const pattern of this.CRITICAL_PATTERNS) {
      const match = params.textInput.match(pattern);
      if (match) {
        matchedKeywords.push(match[0].toLowerCase());
      }
    }

    if (matchedKeywords.length === 0) {
      return { isFlagged: false, crisisResources: null };
    }

    // Create Class F Safeguarding Event
    const event: SafeguardingEvent = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      participantId: params.participantId,
      severity: SafetySeverityLevel.CRITICAL,
      triggeredKeywords: Array.from(new Set(matchedKeywords)),
      assessmentId: params.assessmentId,
      questionId: params.questionId,
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    this.events.push(event);

    // Mandatory Audit Logging for Class F (AC-009)
    AuditLogger.log({
      tenantId: params.tenantId,
      actorId: 'SYSTEM_SAFEGUARDING_ENGINE',
      action: 'SAFEGUARDING_TRIGGERED',
      classification: DataClassification.CLASS_F_SAFEGUARDING,
      resourceType: 'SafeguardingEvent',
      resourceId: event.id,
      metadata: { severity: event.severity, keywordCount: matchedKeywords.length },
    });

    const crisisResources = this.resolveCrisisResources(params.tenantId);

    return {
      isFlagged: true,
      event,
      crisisResources,
    };
  }

  /**
   * Resolves tenant-specific regional crisis helplines (PRD §61).
   * Never hardcodes a single global number.
   */
  public static resolveCrisisResources(
    tenantId: string,
    countryCode?: string
  ): CrisisResourceConfig | null {
    const configs = this.crisisConfigs.get(tenantId) || [];
    if (configs.length === 0) return null;

    if (countryCode) {
      const matched = configs.find((c) => c.countryCode.toUpperCase() === countryCode.toUpperCase());
      if (matched) return matched;
    }

    return configs[0]; // Primary tenant configured crisis resource
  }

  /**
   * Retrieves Class F safeguarding alerts, strictly restricted to SAFEGUARDING_OFFICER role.
   */
  public static getAlertsForOfficer(officerSession: UserSession): SafeguardingEvent[] {
    if (officerSession.role !== Role.SAFEGUARDING_OFFICER) {
      throw new Error(
        `ClassFAccessDenied: User ${officerSession.userId} with role ${officerSession.role} cannot view Class F safeguarding events.`
      );
    }

    return this.events.filter((e) => e.tenantId === officerSession.tenantId);
  }

  public static _clearForTesting(): void {
    this.crisisConfigs.clear();
    this.events = [];
  }
}
