"use client";
import { useUiText } from "@/components/locale-context";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const sectors = [
  { value: "corporate", label: "Workplace or organisation" },
  { value: "school", label: "School or university" },
  { value: "church", label: "Church or faith community" },
  { value: "training", label: "Training provider or programme" },
] as const;

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OnboardingPage() {
  const { locale, t } = useUiText();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [organisationSlug, setOrganisationSlug] = useState("");
  const [sector, setSector] =
    useState<(typeof sectors)[number]["value"]>("corporate");
  const [status, setStatus] = useState<"ready" | "saving" | "error">("ready");
  const [message, setMessage] = useState("");
  const [canBootstrap, setCanBootstrap] = useState<boolean | null>(null);
  const canSubmit = useMemo(
    () =>
      Boolean(
        fullName.trim() && organisationName.trim() && organisationSlug.trim(),
      ),
    [fullName, organisationName, organisationSlug],
  );

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: memberships, error: memberError } = await supabase
        .from("sweep_memberships")
        .select("id")
        .eq("is_active", true)
        .limit(1);
      if (memberError) {
        setMessage(
          t("Your organization access could not be loaded. Please try again."),
        );
        return;
      }
      if (memberships?.length) {
        router.replace("/dashboard");
        return;
      }
      const { data, error } = await supabase.rpc("sweep_can_bootstrap");
      if (error) {
        setMessage(t("Setup is temporarily unavailable. Please try again."));
        return;
      }
      setCanBootstrap(Boolean(data));
    });
  }, [router]);

  async function completeSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("saving");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("sweep_bootstrap_first_owner", {
      p_full_name: fullName.trim(),
      p_tenant_name: organisationName.trim(),
      p_tenant_slug: organisationSlug.trim(),
      p_sector: sector,
    });

    if (error) {
      setStatus("error");
      setMessage(
        t("We could not complete the setup. Check the details and try again."),
      );
      return;
    }

    router.replace("/dashboard");
  }

  if (canBootstrap === false)
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <section className="panel">
          <h1 className="text-2xl font-semibold">
            {t("Your invitation is needed")}
          </h1>
          <p className="muted mt-3">
            {t(
              "You are signed in, but your email has no active organization access yet. Ask your organization administrator to invite this exact email address, then sign in again.",
            )}
          </p>
          <a className="button mt-5" href="/login">
            {t("Return to sign in")}
          </a>
        </section>
      </main>
    );
  if (canBootstrap === null)
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <p className="panel" role="status">
          {message || t("Checking your organization access…")}
        </p>
      </main>
    );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 sm:py-20">
      <section
        className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        aria-labelledby="setup-title"
      >
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
          {t("Welcome to SWEEP Care")}
        </p>
        <h1
          id="setup-title"
          className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950"
        >
          {t("Set up your organisation")}
        </h1>
        <p className="mt-3 leading-6 text-slate-600">
          {t(
            "This takes about a minute. You will be the first organisation administrator and can invite others later.",
          )}
        </p>

        <form className="mt-7 space-y-5" onSubmit={completeSetup}>
          <div>
            <label
              htmlFor="full-name"
              className="block text-sm font-bold text-slate-800"
            >
              {t("Your name")}
            </label>
            <input
              id="full-name"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <label
              htmlFor="organisation-name"
              className="block text-sm font-bold text-slate-800"
            >
              {t("Organisation name")}
            </label>
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
            <label
              htmlFor="organisation-slug"
              className="block text-sm font-bold text-slate-800"
            >
              {t("Short address")}
            </label>
            <input
              id="organisation-slug"
              required
              value={organisationSlug}
              onChange={(event) =>
                setOrganisationSlug(makeSlug(event.target.value))
              }
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
              aria-describedby="slug-help"
            />
            <p id="slug-help" className="mt-2 text-sm text-slate-600">
              {t(
                "Lower-case letters, numbers, and hyphens only. Example: calm-harbour-school.",
              )}
            </p>
          </div>

          <fieldset>
            <legend className="block text-sm font-bold text-slate-800">
              {t("Your sector")}
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {sectors.map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50"
                >
                  <input
                    type="radio"
                    name="sector"
                    value={option.value}
                    checked={sector === option.value}
                    onChange={() => setSector(option.value)}
                    className="h-5 w-5 accent-teal-700"
                  />
                  {t(option.label)}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={!canSubmit || status === "saving"}
            className="min-h-12 w-full rounded-lg bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-700/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {status === "saving"
              ? t("Saving your organisation…")
              : t("Finish setup")}
          </button>
        </form>

        {message ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
          >
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
