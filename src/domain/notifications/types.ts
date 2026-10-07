/**
 * SWEEP Care AI — Notification Engine Types (PRD §72)
 *
 * RULE 8: No production mocks. Transport is configurable via environment.
 * RULE 11: No credentials in code.
 * Privacy: Notification previews MUST NOT contain wellbeing scores, case note
 * content, or any Class D/E/F data. Only safe structural metadata (e.g. "you
 * have a new check-in ready") is permitted in message bodies.
 */

export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP';

export type NotificationCategory =
  | 'ASSESSMENT_INVITATION'   // Invite participant to complete a check-in
  | 'ASSESSMENT_REMINDER'     // Reminder for incomplete check-in
  | 'PROGRAMME_ENROLLED'      // Participant enrolled in a programme
  | 'PROGRAMME_SESSION_DUE'   // Upcoming facilitated session reminder
  | 'SAFEGUARDING_ALERT'      // Internal alert to Safeguarding Officer (never to participant)
  | 'CASE_STATUS_UPDATE'      // Internal alert to Wellbeing Professional
  | 'REPORT_READY';           // Impact report generated for authorised viewer

export interface NotificationTemplate {
  category: NotificationCategory;
  channel: NotificationChannel;
  subjectLine: string;         // Email subject or SMS opening — NO sensitive data
  bodyPreview: string;         // Short preview — NO scores, notes, or Class D content
  ctaLabel: string;
  ctaPath: string;             // Relative path within the platform
}

export interface NotificationPayload {
  tenantId: string;
  recipientUserId: string;
  recipientEmail?: string;     // Required for EMAIL channel
  recipientPhone?: string;     // Required for SMS channel
  category: NotificationCategory;
  channel: NotificationChannel;
  /** Safe context metadata — must not include any Class D/E/F values */
  safeContext: Record<string, string>;
}

export interface NotificationResult {
  success: boolean;
  notificationId: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  /** If false, reason is captured here for audit — never silently swallowed (Rule 9) */
  failureReason?: string;
  dispatchedAt: string; // ISO 8601
}

export interface QueuedNotification extends NotificationPayload {
  id: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  createdAt: string;
  sentAt?: string;
  failureReason?: string;
}
