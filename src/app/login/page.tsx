'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function sendSignInLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setStatus('error');
      setMessage('We could not send a sign-in link. Please check the address and try again.');
      return;
    }

    setStatus('sent');
    setMessage('Your secure sign-in link has been sent. You can safely close this page while you check your email.');
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 sm:py-20">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="sign-in-title">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">SWEEP Care</p>
        <h1 id="sign-in-title" className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Sign in securely</h1>
        <p className="mt-3 leading-6 text-slate-600">
          We will send a one-time link to your email. There is no password to remember.
        </p>

        <form className="mt-7 space-y-5" onSubmit={sendSignInLink}>
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-800">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="min-h-12 w-full rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-teal-700/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {status === 'sending' ? 'Sending your link…' : 'Send secure sign-in link'}
          </button>
        </form>

        {message ? (
          <p
            className={`mt-5 rounded-lg px-4 py-3 text-sm leading-6 ${status === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-teal-50 text-teal-900'}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        ) : null}

        <a href="/" className="mt-7 inline-flex min-h-11 items-center text-sm font-bold text-teal-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
          Return to SWEEP Care
        </a>
      </section>
    </main>
  );
}
