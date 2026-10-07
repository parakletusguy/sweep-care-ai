import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationEngine, NoopTransport } from '../src/domain/notifications/notification-engine';
import type { NotificationPayload } from '../src/domain/notifications/types';

describe('Notification Engine', () => {
  let engine: NotificationEngine;
  let transport: NoopTransport;

  beforeEach(() => {
    transport = new NoopTransport();
    engine = new NotificationEngine(transport);
  });

  // -------------------------------------------------------------------------
  // Happy-path dispatch
  // -------------------------------------------------------------------------

  it('dispatches an assessment invitation successfully', async () => {
    const payload: NotificationPayload = {
      tenantId: 'tenant-001',
      recipientUserId: 'user-abc',
      recipientEmail: 'participant@example.org',
      category: 'ASSESSMENT_INVITATION',
      channel: 'EMAIL',
      safeContext: { assessmentName: 'Workforce Wellbeing Pulse' },
    };

    const result = await engine.dispatch(payload);

    expect(result.success).toBe(true);
    expect(result.channel).toBe('EMAIL');
    expect(result.category).toBe('ASSESSMENT_INVITATION');
    expect(result.notificationId).toBeTruthy();
    expect(transport._sentPayloads).toHaveLength(1);
  });

  it('dispatches a safeguarding alert via in-app channel', async () => {
    const payload: NotificationPayload = {
      tenantId: 'tenant-001',
      recipientUserId: 'officer-xyz',
      category: 'SAFEGUARDING_ALERT',
      channel: 'IN_APP',
      safeContext: { alertType: 'crisis_flag' },
    };

    const result = await engine.dispatch(payload);

    expect(result.success).toBe(true);
    expect(result.channel).toBe('IN_APP');
  });

  // -------------------------------------------------------------------------
  // Privacy invariant: no Class D/E/F data in safeContext
  // -------------------------------------------------------------------------

  it('rejects a payload whose safeContext contains a blocked key (score)', async () => {
    const payload: NotificationPayload = {
      tenantId: 'tenant-001',
      recipientUserId: 'user-abc',
      recipientEmail: 'participant@example.org',
      category: 'ASSESSMENT_REMINDER',
      channel: 'EMAIL',
      safeContext: { wellbeing_score: '74' }, // BLOCKED
    };

    const result = await engine.dispatch(payload);

    expect(result.success).toBe(false);
    expect(result.failureReason).toMatch(/sensitive data/i);
    expect(transport._sentPayloads).toHaveLength(0);
  });

  it('rejects a payload whose safeContext key contains "case_note"', async () => {
    const payload: NotificationPayload = {
      tenantId: 'tenant-001',
      recipientUserId: 'officer-xyz',
      category: 'CASE_STATUS_UPDATE',
      channel: 'IN_APP',
      safeContext: { case_note: 'Patient reported acute stress' }, // BLOCKED
    };

    const result = await engine.dispatch(payload);

    expect(result.success).toBe(false);
    expect(result.failureReason).toMatch(/sensitive data/i);
  });

  // -------------------------------------------------------------------------
  // Validation failures
  // -------------------------------------------------------------------------

  it('rejects dispatch when tenantId is missing', async () => {
    const payload = {
      tenantId: '',
      recipientUserId: 'user-abc',
      recipientEmail: 'test@example.com',
      category: 'ASSESSMENT_INVITATION',
      channel: 'EMAIL',
      safeContext: {},
    } as NotificationPayload;

    const result = await engine.dispatch(payload);

    expect(result.success).toBe(false);
    expect(result.failureReason).toMatch(/tenantId/i);
  });

  it('rejects EMAIL dispatch when recipientEmail is missing', async () => {
    const payload: NotificationPayload = {
      tenantId: 'tenant-001',
      recipientUserId: 'user-abc',
      // recipientEmail deliberately omitted
      category: 'ASSESSMENT_INVITATION',
      channel: 'EMAIL',
      safeContext: {},
    };

    const result = await engine.dispatch(payload);

    expect(result.success).toBe(false);
    expect(result.failureReason).toMatch(/recipientEmail/i);
  });

  // -------------------------------------------------------------------------
  // Template content guard: preview must not contain raw score language
  // -------------------------------------------------------------------------

  it('template body previews do not contain raw score or diagnosis language', () => {
    const SENSITIVE_PATTERNS = [/\bscore\b.*\d/i, /diagnos/i, /medication/i, /case note/i];
    const categories = [
      'ASSESSMENT_INVITATION',
      'ASSESSMENT_REMINDER',
      'PROGRAMME_ENROLLED',
      'PROGRAMME_SESSION_DUE',
      'SAFEGUARDING_ALERT',
      'CASE_STATUS_UPDATE',
      'REPORT_READY',
    ] as const;

    for (const cat of categories) {
      const template = NotificationEngine.getTemplate(cat);
      for (const pattern of SENSITIVE_PATTERNS) {
        expect(template.bodyPreview).not.toMatch(pattern);
        expect(template.subjectLine).not.toMatch(pattern);
      }
    }
  });
});
