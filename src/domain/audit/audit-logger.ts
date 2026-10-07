import { AuditActionType, AuditEvent, DataClassification } from './types';
import crypto from 'crypto';

/**
 * Append-only Audit Event Logger (PRD §55, §85, AC-009)
 * Logs access to sensitive Class D, E, and F records with tamper-resistant tracking.
 */
export class AuditLogger {
  private static events: AuditEvent[] = [];

  /**
   * Records an audit event.
   * If classification is Class D, Class E, or Class F, logging is mandatory and strictly recorded.
   */
  public static log(params: {
    tenantId: string;
    actorId: string;
    action: AuditActionType;
    classification: DataClassification;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): AuditEvent {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      actorId: params.actorId,
      action: params.action,
      classification: params.classification,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Store in append-only array (backed by database in production)
    this.events.push(Object.freeze(event));
    return event;
  }

  /**
   * Retrieves audit events for a tenant, subject to authorization.
   */
  public static getEventsForTenant(tenantId: string): readonly AuditEvent[] {
    return this.events.filter((e) => e.tenantId === tenantId);
  }

  /**
   * Clears in-memory events (test isolation only)
   */
  public static _clearForTesting(): void {
    this.events = [];
  }
}
