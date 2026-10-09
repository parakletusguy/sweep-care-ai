import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Church,
  Compass,
  GraduationCap,
  HeartPulse,
  Lock,
  ShieldCheck,
  Users,
} from 'lucide-react';

const sectors = [
  {
    name: 'Workplaces',
    description: 'Help teams understand collective pressures without turning wellbeing into surveillance.',
    icon: Building2,
  },
  {
    name: 'Schools',
    description: 'Give student-support teams a clearer, kinder view of cohort-level needs.',
    icon: GraduationCap,
  },
  {
    name: 'Faith communities',
    description: 'Strengthen pastoral care with confidential check-ins and practical follow-through.',
    icon: Church,
  },
  {
    name: 'Learning cohorts',
    description: 'Measure whether training creates meaningful, sustained improvements.',
    icon: BookOpen,
  },
];

const steps = [
  {
    number: '01',
    title: 'Listen with care',
    description: 'Invite people into respectful, accessible wellbeing check-ins with clear consent and privacy expectations.',
    icon: HeartPulse,
  },
  {
    number: '02',
    title: 'Understand the pattern',
    description: 'Use privacy-protected group insight to identify where support may be most valuable.',
    icon: Compass,
  },
  {
    number: '03',
    title: 'Support and learn',
    description: 'Design human-reviewed programmes, then measure what changes over time.',
    icon: BarChart3,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-sm font-extrabold text-white shadow-sm">
              S
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-slate-950">SWEEP Care AI</span>
              <span className="hidden text-xs font-medium text-slate-500 sm:block">Wellbeing intelligence with human care</span>
            </span>
          </a>

          <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 hover:text-teal-800" href="#how-it-works">
              How it works
            </a>
            <a className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 hover:text-teal-800" href="#privacy">
              Privacy
            </a>
            <a className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 hover:text-teal-800" href="#sectors">
              Sectors
            </a>
          </nav>

          <a
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            View platform preview
          </a>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-800">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Designed for care, not surveillance
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Turn wellbeing signals into thoughtful, measurable support.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              SWEEP Care helps organisations listen respectfully, understand collective needs, and improve support programmes—without exposing personal responses to managers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
              >
                Explore the platform <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 transition hover:border-teal-700 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
              >
                See how it works
              </a>
            </div>
          </div>

          <aside aria-label="Our promises" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-teal-800">Built around trust</p>
            <ul className="mt-6 space-y-5">
              {[
                'Personal responses stay with the participant and authorised care professionals.',
                'Organisation leaders see privacy-protected patterns, not individual wellbeing records.',
                'AI suggestions are source-grounded, clearly labelled, and reviewed by humans.',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section id="how-it-works" className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-teal-800">A simple, human process</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">From a respectful check-in to better support.</h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.number} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <span className="text-sm font-extrabold text-teal-800">{step.number}</span>
                    <Icon className="mt-5 h-7 w-7 text-teal-700" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-bold text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section id="privacy" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 rounded-3xl bg-slate-900 p-7 text-white sm:p-10 lg:grid-cols-[auto_1fr] lg:items-start">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/20 text-teal-200">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-teal-200">Privacy is part of the product</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Useful insight should never cost someone their dignity.</h2>
              <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                SWEEP Care is designed to make visibility rules clear, suppress small-group results, and keep human judgement in charge of consequential decisions.
              </p>
            </div>
          </div>
        </section>

        <section id="sectors" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-teal-800">Designed for the organisations that care for people</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">One trusted foundation. Language and workflows that fit your setting.</h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {sectors.map((sector) => {
                const Icon = sector.icon;
                return (
                  <article key={sector.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <Icon className="h-7 w-7 text-teal-700" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-bold text-slate-950">{sector.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{sector.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 pt-4 sm:px-6 sm:pb-24 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl border border-teal-100 bg-teal-50 px-6 py-10 text-center sm:px-12">
            <Users className="mx-auto h-8 w-8 text-teal-700" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">Care becomes stronger when people can be heard safely.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">Explore the platform preview to see the product areas that will support participants, care teams, and organisation leaders.</p>
            <a
              href="/dashboard"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
            >
              View platform preview <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SWEEP Care AI</p>
          <p>Wellbeing intelligence with privacy, evidence, and human judgement at its centre.</p>
        </div>
      </footer>
    </div>
  );
}
