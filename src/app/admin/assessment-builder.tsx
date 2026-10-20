"use client";
import { useUiText } from "@/components/locale-context";
import { useState, useTransition } from "react";
import { publishCheckIn } from "../workspace-actions";

export function AssessmentBuilder({ tenantId }: { tenantId: string }) {
  const { locale, t } = useUiText();
  const [questions, setQuestions] = useState([
    { label: "", domain: "", min: 1, max: 5, reverse: false },
  ]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="panel space-y-4"
      action={(form) =>
        startTransition(async () => {
          setMessage("");
          try {
            await publishCheckIn(form);
            setMessage(
              t(
                "Check-in published and available to adult participants with consent.",
              ),
            );
          } catch {
            setMessage(
              t(
                "Unable to publish. Check every question, domain, scale and closing date.",
              ),
            );
          }
        })
      }
    >
      <h2 className="text-xl font-semibold">
        {t("Publish a custom check-in")}
      </h2>
      <p className="muted">
        {t(
          "Enter your own reviewed questions. This creates an immutable instrument and an identified campaign for the organization’s participants. Custom scores are non-diagnostic.",
        )}
      </p>
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="questions" value={JSON.stringify(questions)} />
      <label className="block text-sm">
        {t("Title")}
        <input
          className="field"
          name="title"
          required
          minLength={2}
          maxLength={160}
        />
      </label>
      <label className="block text-sm">
        {t("Participant introduction")}
        <textarea className="field" name="description" maxLength={2000} />
      </label>
      <label className="block text-sm">
        {t("Closes at (your local time)")}
        <input className="field" name="closes" type="datetime-local" required />
      </label>
      {questions.map((q, index) => (
        <fieldset key={index} className="space-y-3 rounded-xl border p-4">
          <legend className="px-1 text-sm font-semibold">
            {t("Question")}
            {index + 1}
          </legend>
          <label className="block text-sm">
            {t("Question text")}
            <input
              className="field"
              required
              minLength={2}
              maxLength={500}
              value={q.label}
              onChange={(e) =>
                setQuestions((v) =>
                  v.map((item, i) =>
                    i === index ? { ...item, label: e.target.value } : item,
                  ),
                )
              }
            />
          </label>
          <label className="block text-sm">
            {t("Domain name")}
            <input
              className="field"
              required
              value={q.domain}
              onChange={(e) =>
                setQuestions((v) =>
                  v.map((item, i) =>
                    i === index ? { ...item, domain: e.target.value } : item,
                  ),
                )
              }
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              {t("Minimum")}
              <input
                className="field"
                type="number"
                min={1}
                max={9}
                value={q.min}
                onChange={(e) =>
                  setQuestions((v) =>
                    v.map((item, i) =>
                      i === index
                        ? { ...item, min: Number(e.target.value) }
                        : item,
                    ),
                  )
                }
              />
            </label>
            <label className="text-sm">
              {t("Maximum")}
              <input
                className="field"
                type="number"
                min={2}
                max={10}
                value={q.max}
                onChange={(e) =>
                  setQuestions((v) =>
                    v.map((item, i) =>
                      i === index
                        ? { ...item, max: Number(e.target.value) }
                        : item,
                    ),
                  )
                }
              />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={q.reverse}
              onChange={(e) =>
                setQuestions((v) =>
                  v.map((item, i) =>
                    i === index ? { ...item, reverse: e.target.checked } : item,
                  ),
                )
              }
            />
            {t("Reverse scoring: lower answers contribute higher scores")}
          </label>
          {questions.length > 1 ? (
            <button
              type="button"
              className="text-sm underline"
              onClick={() =>
                setQuestions((v) => v.filter((_, i) => i !== index))
              }
            >
              {t("Remove question")}
            </button>
          ) : null}
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={questions.length >= 50}
          className="min-h-11 rounded-lg border px-4 text-sm"
          onClick={() =>
            setQuestions((v) => [
              ...v,
              { label: "", domain: "", min: 1, max: 5, reverse: false },
            ])
          }
        >
          {t("Add question")}
        </button>
        <button className="button" disabled={pending}>
          {pending ? t("Publishing…") : t("Publish and open campaign")}
        </button>
      </div>
      <p role="status" className="muted">
        {message}
      </p>
    </form>
  );
}
