/**
 * SWEEP Care AI — Locale Store (PRD §90)
 *
 * Simple in-process locale store. Locale preference is stored per-session only.
 * No external i18n library required — keeps the bundle lean and avoids Rule 3
 * (Do Not Invent External APIs) violations.
 */

import type { SupportedLocale, LocaleStrings } from './types';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { es } from './locales/es';

const LOCALE_MAP: Record<SupportedLocale, LocaleStrings> = { en, fr, es };

let _currentLocale: SupportedLocale = 'en';

export class LocaleStore {
  /**
   * Set the active locale for this session.
   * Safe default: falls back to English for unsupported values.
   */
  static setLocale(locale: SupportedLocale): void {
    _currentLocale = locale;
  }

  static getLocale(): SupportedLocale {
    return _currentLocale;
  }

  /**
   * Returns the string for the given key in the active locale.
   * Falls back to English if the key is missing (should not happen in practice,
   * as TypeScript enforces completeness, but guards against runtime surprises).
   */
  static t(key: keyof LocaleStrings): string {
    const strings = LOCALE_MAP[_currentLocale];
    const value = strings[key];
    if (value !== undefined) return value;
    // Fallback to English (Rule 7 — safe defaults)
    return en[key] ?? key;
  }

  /**
   * Returns the full locale strings object for the active locale.
   * Used by React components that need multiple strings at once.
   */
  static getStrings(): LocaleStrings {
    return LOCALE_MAP[_currentLocale];
  }
}
