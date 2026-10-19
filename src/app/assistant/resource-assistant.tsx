"use client";
import { useState } from "react";
import type { ResourceReply } from "@/domain/ai-assistant/resource-navigation";
export function ResourceAssistant({
  organizations,
}: {
  organizations: { id: string; name: string }[];
}) {
  const [tenant, setTenant] = useState(organizations[0].id),
    [message, setMessage] = useState(""),
    [reply, setReply] = useState<ResourceReply | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="max-w-3xl">
      <p className="muted mb-5">
        Automated resource navigation · This assistant retrieves reviewed source
        text. It does not generate medical advice or contact emergency services.
        Your search text is not saved in the response audit.
      </p>
      <form
        className="panel space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError("");
          setReply(null);
          try {
            const result = await fetch("/api/assistant", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tenantId: tenant, message }),
            });
            const payload = await result.json();
            if (!result.ok) throw new Error(payload.error);
            setReply(payload);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Unable to find resources.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="block text-sm">
          Organization
          <select
            className="field"
            value={tenant}
            onChange={(e) => {
              setTenant(e.target.value);
              setReply(null);
            }}
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          What would you like resources about?
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
        <button className="button" disabled={pending}>
          {pending ? "Finding reviewed resources…" : "Find resources"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="panel mt-5">
          {error}
        </p>
      ) : null}
      {reply ? (
        <section className="panel mt-5" aria-live="polite">
          <p className="leading-7">{reply.text}</p>
          {reply.resources.map((r) => (
            <article key={r.id} className="mt-5 border-t pt-5">
              <h2 className="font-semibold">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-800 underline"
                >
                  {r.title}
                </a>
              </h2>
              <blockquote className="mt-3 whitespace-pre-wrap border-l-2 border-teal-300 pl-4 text-sm leading-7">
                {r.excerpt}
              </blockquote>
              <p className="mt-3 text-xs text-slate-500">
                Approved {new Date(r.approved_at).toLocaleDateString()} · Source{" "}
                {r.id}
              </p>
            </article>
          ))}
          <p className="mt-5 text-xs text-slate-500">
            {reply.modelVersion} · {reply.promptVersion}
          </p>
        </section>
      ) : null}
    </div>
  );
}
