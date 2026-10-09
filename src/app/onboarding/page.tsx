'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const sectors = [
  { value: 'corporate', label: 'Workplace or organisation' },
  { value: 'school', label: 'School or university' },
  { value: 'church', label: 'Church or faith community' },
  { value: 'training', label: 'Training provider or programme' },
] as const;

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [organisationName, setOrganisationName] = useState('');
  const [organisationSlug, setOrganisationSlug] = useState('');
  const [sector, setSector] = useState<(typeof sectors)[number]['value']>('corporate');
  const [status, setStatus] = useState<'ready' | 'saving' | 'error'>('ready');
  const [message, setMessage] = useState('');
  const canSubmit = useMemo(
    () => Boolean(fullName.trim() && organisationName.trim() && organisationSlug.trim()),
    [fullName, organisationName, organisationSlug]
  );

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login');
    });
  }, [router]);

  async function completeSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('saving');
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.rpc('sweep_bootstrap_first_owner', {
      p_full_name: fullName.trim(),
      p_tenant_name: organisationName.trim(),
      p_tenant_slug: organisationSlug.trim(),
      p_sector: sector,
    });

    if (error) {
      setStatus('error');
      setMessage('We could not complete the setup. Check the details and try again.');
      return;
    }

    router.replace('/dashboard');
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 sm:py-20">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="setup-title">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Welcome to SWEEP Care</p>
        <h1 id="setup-title" className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Set up your organisation</h1>
        <p className="mt-3 leading-6 text-slate-600">
          This takes about a minute. You will be the first organisation administrator and can invite others later.
        </p>

        <form className="mt-7 space-y-5" onSubmit={completeSetup}>
          <div>
            <label htmlFor="full-name" className="block text-sm font-bold text-slate-800">Your name</label>
            <input id="full-name" required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2" />
          </div>

          <div>
            <label htmlFor="organisation-name" className="block text-sm font-bold text-slate-800">Organisation name</label>
            <input
              id="organisation-name"
              required
              value={organisationName}
              onChange={(event) => {
                setOrganisationName(event.target.value);
                setOrganisationSlug(makeSlug(event.target.value));
              }}
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <label htmlFor="organisation-slug" className="block text-sm font-bold text-slate-800">Short address</label>
            <input id="organisation-slug" required value={organisationSlug} onChange={(event) => setOrganisationSlug(makeSlug(event.target.value))} className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2" aria-describedby="slug-help" />
            <p id="slug-help" className="mt-2 text-sm text-slate-600">Lower-case letters, numbers, and hyphens only. Example: calm-harbour-school.</p>
          </div>

          <fieldset>
            <legend className="block text-sm font-bold text-slate-800">Your sector</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {sectors.map((option) => (
                <label key={option.value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50">
                  <input type="radio" name="sector" value={option.value} checked={sector === option.value} onChange={() => setSector(option.value)} className="h-5 w-5 accent-teal-700" />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" disabled={!canSubmit || status === 'saving'} className="min-h-12 w-full rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-700/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
            {status === 'saving' ? 'Saving your organisation…' : 'Finish setup'}
          </button>
        </form>

        {message ? <p role="status" aria-live="polite" className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">{message}</p> : null}
      </section>
    </main>
  );
}
