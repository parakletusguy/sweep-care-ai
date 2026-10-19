"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { participantCopy, type Locale } from "@/lib/locale";

type Question = {
  id: string;
  label: string;
  domain: string;
  min: number;
  max: number;
};
export function CheckInForm({
  campaignId,
  questions,
  initialResponses,
  locale,
}: {
  campaignId: string;
  questions: Question[];
  initialResponses: Record<string, number>;
  locale: Locale;
}) {
  const t = participantCopy[locale];
  const router = useRouter();
  const [responses, setResponses] = useState(initialResponses);
  const [saveState, setSaveState] = useState(t.draftIntro);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [changed, setChanged] = useState(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    if (!changed) return;
    setSaveState(t.savingDraft);
    const timer = setTimeout(() => {
      queue.current = queue.current.then(async () => {
        try {
          const response = await fetch(`/api/check-in/${campaignId}/draft`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ responses }),
          });
          if (!response.ok) throw new Error();
          setSaveState(t.savedDraft);
        } catch {
          setSaveState(t.failedDraft);
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [responses, changed, campaignId, t]);
  const answered = questions.filter(
    (q) => responses[q.id] !== undefined,
  ).length;
  return (
    <div className="mx-auto max-w-2xl" lang={locale}>
      <div className="panel mb-5">
        <div className="flex flex-wrap justify-between gap-3 text-sm">
          <span>
            {answered} {t.of} {questions.length} {t.answered}
          </span>
          <Link className="underline" href="/">
            {t.quickExit}
          </Link>
        </div>
        <progress
          className="mt-3 h-2 w-full accent-teal-700"
          max={questions.length}
          value={answered}
        />
        <p className="muted mt-3">{t.visibility}</p>
        <p className="muted mt-2">{t.history}</p>
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-sm text-teal-800"
        >
          {saveState}
        </p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          setMessage("");
          await queue.current;
          try {
            const response = await fetch("/api/check-in", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ campaignId, responses }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error);
            router.push("/dashboard");
            router.refresh();
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Unable to submit.",
            );
            setSubmitting(false);
          }
        }}
        className="space-y-5"
      >
        {questions.map((q, index) => (
          <fieldset className="panel" key={q.id}>
            <legend className="px-2 font-semibold">
              {index + 1}. {q.label}
            </legend>
            <p className="muted mb-3">
              {t.choose}: {q.min}–{q.max}.
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                { length: q.max - q.min + 1 },
                (_, i) => q.min + i,
              ).map((value) => (
                <label
                  key={value}
                  className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 ${responses[q.id] === value ? "border-teal-700 bg-teal-50 text-teal-900" : "border-slate-300"}`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={value}
                    checked={responses[q.id] === value}
                    onChange={() => {
                      setChanged(true);
                      setResponses((previous) => ({
                        ...previous,
                        [q.id]: value,
                      }));
                    }}
                    className="accent-teal-700"
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {message ? (
          <p role="alert" className="panel text-amber-900">
            {message}
          </p>
        ) : null}
        <div className="flex justify-between gap-3">
          <Link
            className="min-h-11 rounded-lg border bg-white px-4 py-2"
            href="/dashboard"
          >
            {t.pause}
          </Link>
          <button
            className="button"
            disabled={answered !== questions.length || submitting}
          >
            {submitting ? t.submitting : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
