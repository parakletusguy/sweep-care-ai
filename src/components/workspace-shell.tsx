import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/workspace-actions";
import { cookies } from "next/headers";
import { parseLocale, participantCopy } from "@/lib/locale";

export async function WorkspaceShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const t =
    participantCopy[parseLocale((await cookies()).get("sweep-locale")?.value)];
  return (
    <div>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link href="/dashboard" className="font-bold text-teal-800">
            SWEEP Care
          </Link>
          <nav
            aria-label="Workspace"
            className="flex flex-wrap items-center gap-4 text-sm"
          >
            <Link href="/dashboard">{t.mySpace}</Link>
            <Link href="/admin">{t.organization}</Link>
            <Link href="/care-team">{t.careTeam}</Link>
            <Link href="/trainer">{t.sessions}</Link>
            <form action={signOut}>
              <button className="underline">{t.signOut}</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">{title}</h1>
        {children}
      </main>
    </div>
  );
}
