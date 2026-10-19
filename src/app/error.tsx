"use client";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <section className="panel">
        <h1 className="text-2xl font-semibold">
          We could not complete that request
        </h1>
        <p className="muted mt-3">
          Your action may not have been saved. Check your connection and access,
          then try again.
        </p>
        <div className="mt-5 flex gap-3">
          <button className="button" onClick={reset}>
            Try again
          </button>
          <a className="button" href="/dashboard">
            Return to my space
          </a>
        </div>
      </section>
    </main>
  );
}
