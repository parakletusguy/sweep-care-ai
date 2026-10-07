/**
 * SWEEP Care AI — Internationalisation (i18n) Types (PRD §90)
 *
 * Supports locale switching at the session level. Locale preference is
 * stored per-session only; it is NOT persisted without explicit consent.
 */

export type SupportedLocale = 'en' | 'fr' | 'es';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'fr', 'es'];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
};

/**
 * All translatable string keys used across the platform.
 * Values in each locale file must cover every key defined here.
 */
export interface LocaleStrings {
  // Navigation
  nav_productLoop: string;
  nav_sectorSolutions: string;
  nav_privacy: string;
  nav_liveDemo: string;
  nav_careTeam: string;
  nav_assistant: string;
  nav_dashboard: string;
  nav_reports: string;
  nav_requestDemo: string;

  // Hero
  hero_badge: string;
  hero_headline_part1: string;
  hero_headline_part2: string;
  hero_subtext: string;
  hero_cta_pilot: string;
  hero_cta_explore: string;

  // Trust badges
  trust_zeroSurveillance: string;
  trust_zeroSurveillance_sub: string;
  trust_pureScoring: string;
  trust_pureScoring_sub: string;
  trust_privacyProtection: string;
  trust_privacyProtection_sub: string;
  trust_humanApproval: string;
  trust_humanApproval_sub: string;

  // Product loop
  loop_sectionLabel: string;
  loop_heading: string;
  loop_subtext: string;

  // Sectors
  sectors_sectionLabel: string;
  sectors_heading: string;
  sectors_subtext: string;

  // Privacy
  privacy_sectionLabel: string;
  privacy_heading: string;
  privacy_subtext: string;

  // Demo
  demo_heading: string;
  demo_subtext: string;
  demo_cta: string;
  demo_confirmed: string;

  // Dashboard
  dashboard_heading: string;
  dashboard_subtext: string;
  dashboard_wellbeingScore: string;
  dashboard_trend: string;
  dashboard_programmes: string;
  dashboard_goals: string;
  dashboard_noProgrammes: string;

  // Impact reports
  reports_heading: string;
  reports_subtext: string;
  reports_preLabel: string;
  reports_postLabel: string;
  reports_improvementLabel: string;

  // Assistant
  assistant_heading: string;
  assistant_subtext: string;
  assistant_placeholder: string;
  assistant_submit: string;
  assistant_safetyLabel: string;

  // Care team
  careTeam_heading: string;
  careTeam_subtext: string;

  // Footer
  footer_copyright: string;
  footer_sectors: string;
  footer_platform: string;
  footer_governance: string;

  // Notifications
  notification_assessmentInvite_subject: string;
  notification_assessmentReminder_subject: string;
  notification_programmeEnrolled_subject: string;
}
