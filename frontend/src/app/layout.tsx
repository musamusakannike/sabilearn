import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sabilearn.online";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SabiLearn — Learn a skill. Sabi it for life.',
    template: '%s | SabiLearn',
  },
  description: 'SabiLearn is a Nigerian EdTech platform offering structured courses, interactive coding exercises, practice quizzes, and AI-powered study tools.',
  applicationName: 'SabiLearn',
  authors: [{ name: 'Codiac', url: 'https://www.codiac.online' }],
  creator: 'Codiac',
  publisher: 'SabiLearn',
  category: 'education',
  keywords: [
    'SabiLearn',
    'Nigerian EdTech',
    'learn tech skills Nigeria',
    'online courses Nigeria',
    'interactive coding quizzes',
    'AI study assistant',
    'lecture summarizer',
    'study flashcards',
    'practice questions Nigeria',
  ],
  alternates: {
    canonical: '/',
    languages: {
      'en-NG': '/',
      en: '/',
    },
  },
  openGraph: {
    siteName: 'SabiLearn',
    type: 'website',
    locale: 'en_NG',
    url: SITE_URL,
    title: 'SabiLearn — Learn a skill. Sabi it for life.',
    description: 'Courses, interactive exercises, practice quizzes, and AI study tools built for Nigerian learners.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SabiLearn — Learn a skill. Sabi it for life.',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SabiLearn — Learn a skill. Sabi it for life.',
    description: 'Courses, interactive exercises, practice quizzes, and AI study tools built for Nigerian learners.',
    creator: '@sabilearn',
    site: '@sabilearn',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  manifest: '/manifest.webmanifest',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'SabiLearn',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: 'Nigerian EdTech platform for courses, flashcards, quizzes and AI-powered study tools.',
      sameAs: ['https://www.codiac.online'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'SabiLearn',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/blog?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#educational-org`,
      name: 'SabiLearn',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: 'Online learning platform providing courses, quizzes, interactive exercises, and AI study tools for Nigerian students.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'SabiLearn Web App',
      operatingSystem: 'Any',
      applicationCategory: 'EducationalApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'NGN',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
        <Toaster position="top-right" richColors closeButton />
        <Analytics />
      </body>
    </html>
  );
}
