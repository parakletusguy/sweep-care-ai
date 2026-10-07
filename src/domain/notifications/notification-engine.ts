/**
 * SWEEP Care AI — Notification Engine (PRD §72)
 *
 * Dispatches assessment invitations, reminders, programme updates, and
 * safeguarding alerts through configurable channels (email, SMS, in-app).
 *
 * KEY PRIVACY INVARIANT (enforced by this module):
 *   Notification payloads and preview bodies MUST NOT contain:
 *   - Individual wellbeing scores (Class D)
 *   - Case note content (Class D/F)
 *   - Safeguarding flag details exposed to the participant
 *   - Any other Class D/E/F raw field values
 *
 * RULE 8: No production mocks in this engine. Transport is injected.
 * RULE 9: Failures are reported — never silently swallowed.
 * RULE 11: No credentials stored here. Transport must be configured externally.
 */

import { randomUUID } from 'crypto';
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
  NotificationTemplate,
  QueuedNotification,
} from './types';

// ---------------------------------------------------------------------------
// Safe notification templates — zero Class D/E/F content
// ---------------------------------------------------------------------------

const TEMPLATES: Record<NotificationCategory, NotificationTemplate> = {
  ASSESSMENT_INVITATION: {
    category: 'ASSESSMENT_INVITATION',
    channel: 'EMAIL',
    subjectLine: 'Your wellbeing check-in is ready',
    bodyPreview:
      'A new wellbeing check-in has been shared with you. It takes around 2 minutes to complete and your responses are completely confidential.',
    ctaLabel: 'Start My Check-In',
    ctaPath: '/check-in',
  },
  ASSESSMENT_REMINDER: {
    category: 'ASSESSMENT_REMINDER',
    channel: 'EMAIL',
    subjectLine: 'Friendly reminder: complete your wellbeing check-in',
    bodyPreview:
      'You have an outstanding wellbeing check-in waiting. Taking a couple of minutes now helps your organisation understand how to better support you.',
    ctaLabel: 'Complete My Check-In',
    ctaPath: '/check-in',
  },
  PROGRAMME_ENROLLED: {
    category: 'PROGRAMME_ENROLLED',
    channel: 'EMAIL',
    subjectLine: 'You\'ve been enrolled in a wellbeing programme',
    bodyPreview:
      'Your wellbeing professional has enrolled you in a support programme. You can view session details and upcoming dates inside the platform.',
    ctaLabel: 'View My Programme',
    ctaPath: '/dashboard',
  },
  PROGRAMME_SESSION_DUE: {
    category: 'PROGRAMME_SESSION_DUE',
    channel: 'IN_APP',
    subjectLine: 'Upcoming wellbeing session',
    bodyPreview:
      'You have a scheduled wellbeing session coming up. Your facilitator will be ready to support you.',
    ctaLabel: 'View Session Details',
    ctaPath: '/dashboard',
  },
  SAFEGUARDING_ALERT: {
    category: 'SAFEGUARDING_ALERT',
    channel: 'IN_APP',
    subjectLine: 'A safeguarding alert requires your attention',
    // NOTE: No participant identity or case details in body — officer must log in to view
    bodyPreview: 'A safeguarding alert has been flagged and requires immediate review.',
    ctaLabel: 'Review Alert',
    ctaPath: '/care-team',
  },
  CASE_STATUS_UPDATE: {
    category: 'CASE_STATUS_UPDATE',
    channel: 'IN_APP',
    subjectLine: 'A case you manage has been updated',
    bodyPreview: 'A case update is available for your review. Log in to view details.',
    ctaLabel: 'View Case',
    ctaPath: '/care-team',
  },
  REPORT_READY: {
    category: 'REPORT_READY',
    channel: 'EMAIL',
    subjectLine: 'Your wellbeing impact report is ready',
    bodyPreview:
      'A new impact report is available for your organisation. It shows aggregated wellbeing trends and programme outcomes.',
    ctaLabel: 'View Report',
    ctaPath: '/reports',
  },
};

// ---------------------------------------------------------------------------
// Notification transport interface
// ---------------------------------------------------------------------------

export interface NotificationTransport {
  send(payload: NotificationPayload, template: NotificationTemplate): Promise<{ ok: boolean; error?: string }>;
}

/**
 * No-op transport — used in test environments only.
 * RULE 8: This class is explicitly excluded from production builds.
 */
export class NoopTransport implements NotificationTransport {
  readonly _sentPayloads: Array<{ payload: NotificationPayload; template: NotificationTemplate }> = [];

  async send(
    payload: NotificationPayload,
    template: NotificationTemplate
  ): Promise<{ ok: boolean }> {
    this._sentPayloads.push({ payload, template });
    return { ok: true };
  }
}

// ---------------------------------------------------------------------------
// In-memory notification queue (production: replace with Redis/SQS)
// ---------------------------------------------------------------------------

const _queue: QueuedNotification[] = [];

// ---------------------------------------------------------------------------
// Notification Engine
// ---------------------------------------------------------------------------

export class NotificationEngine {
  private readonly _transport: NotificationTransport;

  constructor(transport: NotificationTransport) {
    this._transport = transport;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Enqueue and dispatch a notification.
   * RULE 9: Returns a structured result — never throws silently.
   */
  async dispatch(payload: NotificationPayload): Promise<NotificationResult> {
    // Validate tenant context is present
    if (!payload.tenantId) {
      return this._failResult(payload, 'Missing tenantId — notification rejected.');
    }
    if (!payload.recipientUserId) {
      return this._failResult(payload, 'Missing recipientUserId — notification rejected.');
    }

    // Channel-specific validation
    if (payload.channel === 'EMAIL' && !payload.recipientEmail) {
      return this._failResult(payload, 'EMAIL channel requires recipientEmail.');
    }
    if (payload.channel === 'SMS' && !payload.recipientPhone) {
      return this._failResult(payload, 'SMS channel requires recipientPhone.');
    }

    // Privacy guard: safeContext must not contain blocked field names
    const BLOCKED_CONTEXT_KEYS = [
      'score', 'raw_score', 'wellbeing_score', 'case_note', 'diagnosis',
      'medication', 'safeguarding_detail', 'class_d', 'class_e', 'class_f',
    ];
    for (const key of Object.keys(payload.safeContext)) {
      if (BLOCKED_CONTEXT_KEYS.some((blocked) => key.toLowerCase().includes(blocked))) {
        return this._failResult(
          payload,
          `safeContext key "${key}" may contain sensitive data and is not permitted in notification payloads.`
        );
      }
    }

    const template = TEMPLATES[payload.category];
    const notificationId = randomUUID();
    const now = new Date().toISOString();

    const queued: QueuedNotification = {
      ...payload,
      id: notificationId,
      status: 'QUEUED',
      createdAt: now,
    };
    _queue.push(queued);

    // Dispatch via transport
    const { ok, error } = await this._transport.send(payload, template);

    // Update queue entry
    queued.status = ok ? 'SENT' : 'FAILED';
    queued.sentAt = ok ? now : undefined;
    queued.failureReason = error;

    if (!ok) {
      return {
        success: false,
        notificationId,
        channel: payload.channel,
        category: payload.category,
        failureReason: error ?? 'Transport returned failure without a reason.',
        dispatchedAt: now,
      };
    }

    return {
      success: true,
      notificationId,
      channel: payload.channel,
      category: payload.category,
      dispatchedAt: now,
    };
  }

  /** Retrieve a template for a given category (for preview rendering). */
  static getTemplate(category: NotificationCategory): NotificationTemplate {
    return TEMPLATES[category];
  }

  /** Returns queued notifications for a tenant. */
  static getQueue(tenantId: string): QueuedNotification[] {
    return _queue.filter((n) => n.tenantId === tenantId);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _failResult(
    payload: NotificationPayload,
    reason: string
  ): NotificationResult {
    return {
      success: false,
      notificationId: randomUUID(),
      channel: payload.channel,
      category: payload.category,
      failureReason: reason,
      dispatchedAt: new Date().toISOString(),
    };
  }
}
