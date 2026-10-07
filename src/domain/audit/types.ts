/**
 * PRD §55 Data Classification Hierarchy
 * Access controls and logging become progressively stricter from A to F.
 */
export enum DataClassification {
  /** Class A — Public generic program material */
  CLASS_A_PUBLIC = 'CLASS_A_PUBLIC',
  /** Class B — Organizational operational information */
  CLASS_B_ORGANIZATIONAL = 'CLASS_B_ORGANIZATIONAL',
  /** Class C — Personal identity and contact information */
  CLASS_C_PERSONAL = 'CLASS_C_PERSONAL',
  /** Class D — Sensitive wellbeing responses, profiles, private support */
  CLASS_D_SENSITIVE_WELLBEING = 'CLASS_D_SENSITIVE_WELLBEING',
  /** Class E — Sensitive physiological and health information */
  CLASS_E_SENSITIVE_HEALTH = 'CLASS_E_SENSITIVE_HEALTH',
  /** Class F — Safeguarding and safety crisis escalation data */
  CLASS_F_SAFEGUARDING = 'CLASS_F_SAFEGUARDING',
}

export type AuditActionType =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'SAFEGUARDING_TRIGGERED'
  | 'AI_INFERENCE_GENERATED'
  | 'TENANT_PROVISIONED'
  | 'HEALTH_MEASUREMENT_RECORDED'
  | 'HEALTH_MEASUREMENTS_ACCESSED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorId: string;
  action: AuditActionType;
  classification: DataClassification;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
