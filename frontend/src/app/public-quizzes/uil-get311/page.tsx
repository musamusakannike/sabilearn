import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import UilGet311Hub from '@/components/public-quizzes/UilGet311Hub';
import { SITE_URL } from '@/lib/blog-server';

const PAGE_URL = `${SITE_URL}/public-quizzes/uil-get311`;

export const metadata: Metadata = {
  title: 'UIL-GET 311 Engineering Economics Quiz — Free 300L Practice | SabiLearn',
  description:
    'Practice 160+ University of Ilorin (UNILORIN) UIL-GET 311 Engineering Economics MCQs covering demand & supply, taxation, inflation, money, insurance, time value of money, NPV/IRR/NAW, life cycle costing, and depreciation with LaTeX explanations.',
  keywords: [
    'UIL GET 311',
    'UNILORIN Engineering Economics',
    'GET 311 quiz',
    'GET 311 past questions',
    'Engineering Economics MCQ',
    'SabiLearn',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'UIL-GET 311 Engineering Economics Practice Quiz | SabiLearn',
    description:
      '160+ interactive MCQs with instant feedback and worked LaTeX calculations for UNILORIN 300L Engineering students.',
    url: PAGE_URL,
    siteName: 'SabiLearn',
    locale: 'en_NG',
    type: 'website',
  },
};

export default function UilGet311QuizHubPage() {
  return (
    <>
      <Navbar />
      <UilGet311Hub />
      <Footer />
    </>
  );
}
