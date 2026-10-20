import type { Metadata } from "next";
import "./globals.css";
import { serverLocale } from "@/lib/server-locale";
import { LocaleProvider, LanguageControl } from "@/components/locale-context";

export const metadata: Metadata = {
  title:
    "SWEEP Care AI — White-Label Wellbeing Intelligence & Programme Design Platform",
  description:
    "Private wellbeing check-ins, consent-aware personal results and human-reviewed care workflows for organizations.",
  keywords: [
    "wellbeing intelligence platform",
    "enterprise wellbeing analytics",
    "white-label wellbeing software",
    "b2b employee wellbeing",
    "k-anonymity workplace analytics",
    "student wellbeing check-in platform",
    "evidence-based intervention design",
    "pre post outcome measurement",
    "trauma-informed wellbeing UX",
    "privacy-preserving employee survey",
  ],
  authors: [{ name: "SWEEP Care AI" }],
  creator: "SWEEP Care AI",
  publisher: "SWEEP Care AI",
  metadataBase: new URL("https://careai.sweepacademy.org"),
  openGraph: {
    title: "SWEEP Care AI — Wellbeing Intelligence & Programme Design Platform",
    description:
      "Private wellbeing check-ins, reviewed resources and human-led support for organizations.",
    url: "https://careai.sweepacademy.org",
    siteName: "SWEEP Care AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SWEEP Care AI — Wellbeing Intelligence & Programme Design Platform",
    description: "Private check-ins. Reviewed resources. Human-led support.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await serverLocale();
  return (
    <html lang={locale} className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        <LocaleProvider value={locale}>
          <LanguageControl />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
