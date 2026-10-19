import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  LockKeyhole,
  NotebookPen,
  Users,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f9f6] text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-white">
            S
          </span>
          SWEEP Care AI
        </Link>
        <Link
          className="min-h-11 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold"
          href="/login"
        >
          Sign in
        </Link>
      </header>
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pb-20">
          <div>
            <p className="mb-5 text-sm font-semibold tracking-wide text-teal-800">
              A little space for better care.
            </p>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl">
              Listen. Understand.
              <br />
              <span className="text-teal-800">Care together.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Private wellbeing check-ins and practical follow-through for the
              people in your organization.
            </p>
            <Link className="button mt-7 gap-2" href="/login">
              Enter your care space
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              For workplaces, schools, faith communities and learning groups.
            </p>
          </div>
          <div className="relative rounded-[2rem] bg-teal-900 p-7 text-white sm:p-9">
            <HeartHandshake
              className="h-12 w-12 text-teal-200"
              aria-hidden="true"
            />
            <h2 className="mt-7 max-w-xs text-3xl font-medium leading-tight">
              Small check-ins.
              <br />
              Thoughtful support.
            </h2>
            <div className="mt-7 space-y-4 border-t border-teal-700 pt-6">
              {[
                ["01", "Check in at your own pace"],
                ["02", "Keep your personal results private"],
                ["03", "Connect with human care"],
              ].map(([n, text]) => (
                <p key={n} className="flex items-center gap-4 text-sm">
                  <span className="text-teal-300">{n}</span>
                  {text}
                </p>
              ))}
            </div>
          </div>
        </section>
        <section
          aria-label="How care works"
          className="border-y border-slate-200 bg-white"
        >
          <div className="mx-auto grid max-w-6xl gap-7 px-5 py-9 md:grid-cols-3">
            {[
              {
                icon: NotebookPen,
                title: "Your voice, your choice",
                text: "Choose whether to take part. Save your progress and come back when you are ready.",
              },
              {
                icon: LockKeyhole,
                title: "Clear privacy boundaries",
                text: "Managers and HR do not receive your personal check-in answers or confidential care notes.",
              },
              {
                icon: Users,
                title: "People at the centre",
                text: "Care professionals and facilitators manage support with human review and clear responsibilities.",
              },
            ].map((item) => (
              <article key={item.title}>
                <item.icon
                  className="h-5 w-5 text-teal-800"
                  aria-hidden="true"
                />
                <h2 className="mt-3 font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-9">
          <details className="rounded-xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer text-sm font-semibold">
              A few things to know before you begin
            </summary>
            <div className="mt-4 max-w-3xl space-y-3 text-sm leading-7 text-slate-600">
              <p>
                Your organization invitation determines your workspace access.
                Personal results are calculated from the check-in’s published
                scoring rules and are not a medical diagnosis.
              </p>
              <p>
                The resource assistant displays organization-reviewed excerpts
                with source links. It cannot provide emergency assistance. If
                you are in immediate danger, contact local emergency services or
                a healthcare professional.
              </p>
              <p>
                You can manage assessment consent and language preferences from
                your personal space. Withdrawing consent stops future
                submissions; it does not erase submitted history.
              </p>
            </div>
          </details>
        </section>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 pb-7 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SWEEP Care AI</p>
        <p>Care with privacy and human judgement.</p>
      </footer>
    </div>
  );
}
