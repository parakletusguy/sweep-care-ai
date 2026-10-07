import crypto from 'crypto';
import { CaseManager } from '../cases/case-manager';
import { ReferralStatus } from '../cases/types';
import { TenantContextStore } from '../tenancy/tenant-context';
import { AuditLogger } from '../audit/audit-logger';
import { DataClassification } from '../audit/types';
import { Role, UserSession } from '../identity/roles';

export interface EapWebhookPayload {
  event: 'referral.status_updated' | 'referral.milestone_reached';
  tenantId: string;
  caseId: string;
  referralId: string;
  newStatus: ReferralStatus;
  externalReference?: string;
  notes?: string;
  timestamp: string;
}

/**
 * Phase 2D: External EAP Webhook Bi-directional Integration Manager (PRD §70, §71)
 * Enforces HMAC-SHA256 payload signing, anti-replay verification, and automated referral state syncing.
 */
export class EapWebhookManager {
  private static readonly MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Generates an HMAC-SHA256 signature for outbound webhook dispatch.
   */
  public static signPayload(payloadJson: string, webhookSecret: string): string {
    return (
      'sha256=' +
      crypto.createHmac('sha256', webhookSecret).update(payloadJson, 'utf8').digest('hex')
    );
  }

  /**
   * Validates inbound HMAC-SHA256 signature using timing-safe comparison.
   */
  public static verifySignature(
    payloadJson: string,
    signatureHeader: string,
    webhookSecret: string
  ): boolean {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return false;
    }

    const expectedSignature = this.signPayload(payloadJson, webhookSecret);
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signatureHeader, 'utf8')
    );
  }

  /**
   * Ingests and processes a validated inbound status update from an external EAP partner.
   */
  public static processInboundWebhook(
    payloadJson: string,
    signatureHeader: string,
    webhookSecret: string
  ): { success: boolean; referralId: string; newStatus: ReferralStatus } {
    // 1. Verify HMAC Signature
    if (!this.verifySignature(payloadJson, signatureHeader, webhookSecret)) {
      throw new Error('WebhookSecurityViolation: Invalid HMAC signature.');
    }

    const payload: EapWebhookPayload = JSON.parse(payloadJson);

    // 2. Anti-Replay Timestamp Validation
    const eventTime = new Date(payload.timestamp).getTime();
    if (isNaN(eventTime) || Math.abs(Date.now() - eventTime) > this.MAX_TIMESTAMP_DRIFT_MS) {
      throw new Error('WebhookSecurityViolation: Timestamp expired or invalid drift.');
    }

    // 3. System Session for External EAP Sync
    const systemSession: UserSession = {
      userId: `EXT_EAP_${payload.externalReference || 'PARTNER'}`,
      tenantId: payload.tenantId,
      email: 'eap-integration@system.local',
      role: Role.WELLBEING_PROFESSIONAL, // Uses care professional privileges to update referral
    };

    // 4. Execute inside Tenant Isolation Boundary
    return TenantContextStore.run(
      { tenantId: payload.tenantId, tenantSlug: payload.tenantId },
      () => {
      const updatedReferral = CaseManager.updateReferralStatus(
        systemSession,
        payload.caseId,
        payload.referralId,
        payload.newStatus
      );

      AuditLogger.log({
        tenantId: payload.tenantId,
        actorId: systemSession.userId,
        action: 'UPDATE',
        classification: DataClassification.CLASS_D_SENSITIVE_WELLBEING,
        resourceType: 'EapWebhookSync',
        resourceId: payload.referralId,
        metadata: {
          externalRef: payload.externalReference,
          newStatus: payload.newStatus,
          notes: payload.notes,
        },
      });

      return {
        success: true,
        referralId: updatedReferral.id,
        newStatus: updatedReferral.status,
      };
    });
  }
}
