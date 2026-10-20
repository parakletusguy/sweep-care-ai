"use client";
import { useUiText } from "@/components/locale-context";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  const { locale, t } = useUiText();
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <section className="panel">
        <h1 className="text-2xl font-semibold">
          {t("We could not complete that request")}
        </h1>
        <p className="muted mt-3">
          {t(
            "Your action may not have been saved. Check your connection and access, then try again.",
          )}
        </p>
        <div className="mt-5 flex gap-3">
          <button className="button" onClick={reset}>
            {t("Try again")}
          </button>
          <a className="button" href="/dashboard">
            {t("Return to my space")}
          </a>
        </div>
      </section>
    </main>
  );
}
