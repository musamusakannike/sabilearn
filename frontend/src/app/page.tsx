import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import FeatureDetailSection from '@/components/landing/FeatureDetailSection';
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import { faqs } from '@/lib/faqs';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/ui/Footer';
import ContinueToDashboardPrompt from '@/components/ui/ContinueToDashboardPrompt';
import SwepChrome from '@/components/swep/SwepChrome';

export const metadata: Metadata = {
  title: 'SabiLearn — Learn a skill. Sabi it for life.',
  description:
    'Courses, interactive exercises, practice quizzes, and AI study tools built for Nigerian learners. Start free, track your progress, and sabi a new skill for life.',
  keywords: [
    'SabiLearn',
    'Nigerian EdTech',
    'learn practical skills',
    'online courses Nigeria',
    'interactive coding quizzes',
    'AI study assistant',
    'SWEP Unilorin past questions',
    'study smarter Nigeria',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'SabiLearn — Learn a skill. Sabi it for life.',
    description:
      'Courses, interactive exercises, practice quizzes, and AI study tools built for Nigerian learners.',
    url: '/',
    siteName: 'SabiLearn',
    locale: 'en_NG',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SabiLearn — Learn a skill. Sabi it for life.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SabiLearn — Learn a skill. Sabi it for life.',
    description:
      'Courses, interactive exercises, practice quizzes, and AI study tools built for Nigerian learners.',
    images: ['/og-image.png'],
  },
};

const pageJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://sabilearn.online/#webpage',
      name: 'SabiLearn — Learn a skill. Sabi it for life.',
      url: 'https://sabilearn.online/',
      description:
        'Courses, interactive exercises, practice quizzes, and AI study tools built for Nigerian learners.',
      inLanguage: 'en-NG',
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: 'https://sabilearn.online/og-image.png',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://sabilearn.online/#faq',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ],
};

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'SWEP', href: '/swep' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '#faq' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <SwepChrome />
      <ContinueToDashboardPrompt />
      <Navbar links={navLinks} />

      <HeroSection />

      <FeaturesSection />

      <FeatureDetailSection />

      <PricingSection />

      <TestimonialsSection />

      <FAQSection />

      <CTASection />

      <Footer />
    </div>
  );
}
