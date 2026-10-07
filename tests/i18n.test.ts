import { describe, it, expect, afterEach } from 'vitest';
import { LocaleStore } from '../src/domain/i18n/locale-store';
import { SUPPORTED_LOCALES } from '../src/domain/i18n/types';

describe('Internationalisation (i18n) — LocaleStore', () => {
  afterEach(() => {
    // Reset to English after every test
    LocaleStore.setLocale('en');
  });

  it('defaults to English', () => {
    expect(LocaleStore.getLocale()).toBe('en');
  });

  it('switches locale and returns strings in the correct language', () => {
    LocaleStore.setLocale('fr');
    const t = LocaleStore.t('nav_productLoop');
    expect(t).toBe('Comment ça marche');
  });

  it('returns Spanish strings after switching to es', () => {
    LocaleStore.setLocale('es');
    const t = LocaleStore.t('nav_requestDemo');
    expect(t).toBe('Solicitar una demo');
  });

  it('falls back to English for all locales if a key is missing at runtime', () => {
    // Simulate a key that would only exist in EN by coercing an unknown key
    LocaleStore.setLocale('fr');
    // ts-ignore is intentional here to test the runtime fallback path
    // @ts-expect-error testing fallback with unknown key
    const result = LocaleStore.t('__nonexistent_key__');
    // Should return the key itself as ultimate fallback
    expect(result).toBe('__nonexistent_key__');
  });

  it('getStrings() returns complete string map with no undefined values for all supported locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      LocaleStore.setLocale(locale);
      const strings = LocaleStore.getStrings();

      // Every value in the locale map must be a non-empty string
      for (const [key, value] of Object.entries(strings)) {
        expect(typeof value, `Locale ${locale} key "${key}" should be a string`).toBe('string');
        expect(value.length, `Locale ${locale} key "${key}" should not be empty`).toBeGreaterThan(0);
      }
    }
  });

  it('hero badge text is present and non-empty for all supported locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      LocaleStore.setLocale(locale);
      const badge = LocaleStore.t('hero_badge');
      expect(badge.length).toBeGreaterThan(0);
    }
  });

  it('notification subject lines are safe (no score or clinical data) across all locales', () => {
    const SENSITIVE_PATTERNS = [/\bscore\b/i, /diagnos/i, /case note/i, /medication/i];
    const notificationKeys = [
      'notification_assessmentInvite_subject',
      'notification_assessmentReminder_subject',
      'notification_programmeEnrolled_subject',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      LocaleStore.setLocale(locale);
      for (const key of notificationKeys) {
        const value = LocaleStore.t(key);
        for (const pattern of SENSITIVE_PATTERNS) {
          expect(value, `Locale ${locale} key "${key}" must not contain sensitive patterns`).not.toMatch(pattern);
        }
      }
    }
  });
});
