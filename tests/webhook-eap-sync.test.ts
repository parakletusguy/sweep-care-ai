import { describe, it, expect, beforeEach } from 'vitest';
import { EapWebhookManager, EapWebhookPayload } from '../src/domain/integrations/webhook-manager';
import { CaseManager } from '../src/domain/cases/case-manager';
import { ReferralStatus, ReferralType } from '../src/domain/cases/types';
import { Role, UserSession } from '../src/domain/identity/roles';
import { TenantContextStore } from '../src/domain/tenancy/tenant-context';
import { AuditLogger } from '../src/domain/audit/audit-logger';

describe('Phase 2D: External EAP Webhook Bi-directional Sync', () => {
  const tenantId = '66666666-6666-6666-6666-666666666666';
  const webhookSecret = 'super-secret-eap-webhook-token-32char!';

  const professionalUser: UserSession = {
    userId: 'prof-99',
    tenantId,
    email: 'counsellor@org.com',
    role: Role.WELLBEING_PROFESSIONAL,
  };

  beforeEach(() => {
    CaseManager._clearForTesting();
    AuditLogger._clearForTesting();
  });

  it('validates HMAC-SHA256 signature and updates referral lifecycle from external partner webhook', () => {
    let testCaseId = '';
    let testReferralId = '';

    // Set up case and referral
    TenantContextStore.run({ tenantId }, () => {
      const c = CaseManager.createCase(professionalUser, {
        tenantId,
        participantId: 'p-88',
        title: 'Trauma & Resilience Care',
        description: 'Referral to external psychological partner.',
      });
      testCaseId = c.id;

      const r = CaseManager.createReferral(professionalUser, c.id, {
        type: ReferralType.EXTERNAL_EAP,
        providerName: 'HealthAssure EAP Services',
        reason: 'Specialized 1-on-1 counseling.',
      });
      testReferralId = r.id;
    });

    // Construct valid external partner webhook payload
    const payload: EapWebhookPayload = {
      event: 'referral.status_updated',
      tenantId,
      caseId: testCaseId,
      referralId: testReferralId,
      newStatus: ReferralStatus.IN_PROGRESS,
      externalReference: 'HA-REF-44910',
      notes: 'Initial 60-min intake completed with Senior Psychotherapist.',
      timestamp: new Date().toISOString(),
    };

    const payloadJson = JSON.stringify(payload);
    const validSignature = EapWebhookManager.signPayload(payloadJson, webhookSecret);

    // 1. Process valid inbound webhook
    const result = EapWebhookManager.processInboundWebhook(
      payloadJson,
      validSignature,
      webhookSecret
    );

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(ReferralStatus.IN_PROGRESS);

    // 2. Reject webhook with invalid signature
    expect(() => {
      EapWebhookManager.processInboundWebhook(
        payloadJson,
        'sha256=invalidtamperedsignature0000000000000000000000000000000000000000',
        webhookSecret
      );
    }).toThrow(/WebhookSecurityViolation: Invalid HMAC signature/);

    // 3. Reject replayed / expired timestamp webhook
    const expiredPayload = {
      ...payload,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes past
    };
    const expiredJson = JSON.stringify(expiredPayload);
    const expiredSig = EapWebhookManager.signPayload(expiredJson, webhookSecret);

    expect(() => {
      EapWebhookManager.processInboundWebhook(expiredJson, expiredSig, webhookSecret);
    }).toThrow(/WebhookSecurityViolation: Timestamp expired/);

    // 4. Verify audit trail logged (AC-009)
    const auditLogs = AuditLogger.getEventsForTenant(tenantId);
    expect(auditLogs.some((l) => l.resourceType === 'EapWebhookSync')).toBe(true);
  });
});
