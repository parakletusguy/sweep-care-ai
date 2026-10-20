"use client";
import { useRef, useState } from "react";
import type { ResourceReply } from "@/domain/ai-assistant/resource-navigation";
import { useUiText } from "@/components/locale-context";

type Turn = { question: string; reply: ResourceReply };
export function ResourceAssistant({
  organizations,
}: {
  organizations: { id: string; name: string }[];
}) {
  const { locale, t } = useUiText();
  const [tenant, setTenant] = useState(organizations[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  function reset() {
    epoch.current++;
    controller.current?.abort();
    controller.current = null;
    setTurns([]);
    setMessage("");
    setError("");
    setPending(false);
  }
  async function send(question: string) {
    if (pending || !tenant || question.trim().length < 2) return;
    const generation = epoch.current;
    const request = new AbortController();
    controller.current = request;
    setPending(true);
    setError("");
    try {
      const result = await fetch("/api/assistant", {
        method: "POST",
        signal: request.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant,
          message: question,
          locale,
          previousTopic: turns.at(-1)?.reply.topic,
        }),
      });
      if (!result.ok) throw new Error("Resource request failed");
      const payload: ResourceReply = await result.json();
      // A previous organization's in-flight response must never appear here.
      if (generation !== epoch.current) return;
      setTurns((previous) => [
        ...previous.slice(-9),
        { question, reply: payload },
      ]);
      setMessage("");
    } catch (err) {
      if (
        generation === epoch.current &&
        !(err instanceof Error && err.name === "AbortError")
      )
        setError(t("Unable to find resources. Please try again."));
    } finally {
      if (generation === epoch.current) setPending(false);
    }
  }
  return (
    <div className="max-w-3xl">
      <h2 className="mb-3 text-xl font-semibold">
        {t("Guided resource conversation")}
      </h2>
      <p className="muted mb-5">
        {t(
          "This automated assistant uses reviewed excerpts, not generated medical advice. Messages stay within SWEEP Care and are not sent to an external AI provider. Conversation text is kept only in this open page, not in the response audit.",
        )}
      </p>
      <div className="panel mb-5 flex flex-wrap items-end justify-between gap-3">
        <label className="block text-sm">
          {t("Organization")}
          <select
            className="field"
            value={tenant}
            onChange={(e) => {
              reset();
              setTenant(e.target.value);
            }}
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg border px-4"
          onClick={reset}
        >
          {t("New conversation")}
        </button>
      </div>
      <section
        aria-label={t("Conversation")}
        aria-live="polite"
        aria-busy={pending}
        className="space-y-5"
      >
        {turns.map((turn, index) => (
          <article className="panel" key={index}>
            <p className="text-xs font-semibold uppercase text-slate-500">
              {t("You")}
            </p>
            <p className="mb-5 whitespace-pre-wrap break-words">
              {turn.question}
            </p>
            <p className="text-xs font-semibold uppercase text-teal-800">
              {t("Assistant")}
            </p>
            <p className="leading-7">{turn.reply.text}</p>
            {turn.reply.resources.map((r) => (
              <section key={r.id} className="mt-5 border-t pt-5">
                <h3 className="font-semibold">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-800 underline"
                  >
                    {r.title}
                  </a>
                </h3>
                <p className="muted mt-2">
                  {t("Original source text · not translated")}
                </p>
                <blockquote className="mt-3 whitespace-pre-wrap border-l-2 border-teal-300 pl-4 text-sm leading-7">
                  {r.excerpt}
                </blockquote>
                <p className="mt-3 text-xs text-slate-500">
                  {t("Approved")}{" "}
                  {new Date(r.approved_at).toLocaleDateString(locale)} ·{" "}
                  {t("Source")} {r.id}
                </p>
              </section>
            ))}
            <p className="mt-5 text-xs text-slate-500">
              {turn.reply.modelVersion} · {turn.reply.promptVersion}
            </p>
          </article>
        ))}
      </section>
      <form
        className="panel mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send(message);
        }}
      >
        <label className="block text-sm">
          {t("What would you like resources about?")}
          <textarea
            className="field"
            required
            minLength={2}
            maxLength={2000}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="button" disabled={pending || !tenant}>
            {pending ? t("Finding reviewed resources…") : t("Send message")}
          </button>
          {turns.at(-1)?.reply.topic ? (
            <button
              type="button"
              className="min-h-11 rounded-lg border px-4"
              disabled={pending}
              onClick={() => void send(t("Tell me more"))}
            >
              {t("Tell me more")}
            </button>
          ) : null}
        </div>
        {error ? <p role="alert">{error}</p> : null}
      </form>
    </div>
  );
}
