import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SWEEP Care AI — White-Label Wellbeing Intelligence & Programme Design Platform',
  description:
    'Turn population wellbeing signals into targeted intervention programmes and measurable human outcomes. White-label, multi-tenant B2B infrastructure with zero employee surveillance, pure-code deterministic scoring, and mathematical K-anonymity privacy.',
  keywords: [
    'wellbeing intelligence platform',
    'enterprise wellbeing analytics',
    'white-label wellbeing software',
    'b2b employee wellbeing',
    'k-anonymity workplace analytics',
    'student wellbeing check-in platform',
    'evidence-based intervention design',
    'pre post outcome measurement',
    'trauma-informed wellbeing UX',
    'privacy-preserving employee survey',
  ],
  authors: [{ name: 'SWEEP Care AI' }],
  creator: 'SWEEP Care AI',
  publisher: 'SWEEP Care AI',
  metadataBase: new URL('https://sweep-care-ai.vercel.app'),
  openGraph: {
    title: 'SWEEP Care AI — Wellbeing Intelligence & Programme Design Platform',
    description:
      'The B2B intelligence infrastructure connecting wellbeing assessments, grounded programme design, human facilitation, and longitudinal outcome measurement.',
    url: 'https://sweep-care-ai.vercel.app',
    siteName: 'SWEEP Care AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SWEEP Care AI — Wellbeing Intelligence & Programme Design Platform',
    description:
      'Assess needs. Design grounded programmes. Measure longitudinal human outcomes. Built with zero employee surveillance and mathematical privacy by design.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}
