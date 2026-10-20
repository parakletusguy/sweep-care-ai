"use client";
import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/locale";
import { uiText } from "@/lib/ui-copy";
import { changeLanguage } from "@/app/locale-actions";
const LocaleContext = createContext<Locale>("en");
export const LocaleProvider = LocaleContext.Provider;
export function useUiText() {
  const locale = useContext(LocaleContext);
  const t = useMemo(() => uiText(locale), [locale]);
  return { locale, t };
}
export function LanguageControl() {
  const { locale, t } = useUiText();
  return (
    <form
      action={changeLanguage}
      className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-2 px-5 py-2 text-sm"
    >
      <label className="flex items-center gap-2">
        {t("Language")}
        <select
          name="locale"
          defaultValue={locale}
          key={locale}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
        </select>
      </label>
      <button className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-semibold">
        {t("Apply language")}
      </button>
    </form>
  );
}
