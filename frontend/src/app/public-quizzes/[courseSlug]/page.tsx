import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import PublicQuizHub from '@/components/public-quizzes/PublicQuizHub';
import {
  getAllPublicQuizSlugs,
  getCourseQuestions,
  getPublicQuizCourse,
} from '@/data/public-quizzes/registry';
import { SITE_URL } from '@/lib/blog-server';

interface CourseQuizPageProps {
  params: Promise<{ courseSlug: string }>;
}

export function generateStaticParams() {
  return getAllPublicQuizSlugs().map((courseSlug) => ({ courseSlug }));
}

export async function generateMetadata({ params }: CourseQuizPageProps): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = getPublicQuizCourse(courseSlug);
  if (!course) return { title: 'Quiz not found | SabiLearn' };

  const totalQs = getCourseQuestions(course).length;
  const url = `${SITE_URL}/public-quizzes/${course.slug}`;
  const fullTitle = `${course.code}: ${course.title} Quiz (${totalQs}+ MCQs) | SabiLearn`;

  return {
    title: fullTitle,
    description: course.description,
    keywords: course.seoKeywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${course.code}: ${course.title} — Practice Quiz`,
      description: `${totalQs} interactive MCQs with instant feedback and worked LaTeX explanations on SabiLearn.`,
      url,
      siteName: 'SabiLearn',
      locale: 'en_NG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${course.code}: ${course.title} — Practice Quiz`,
      description: `${totalQs} interactive MCQs with instant feedback and worked LaTeX explanations on SabiLearn.`,
    },
  };
}

export default async function PublicQuizCourseHubPage({ params }: CourseQuizPageProps) {
  const { courseSlug } = await params;
  const course = getPublicQuizCourse(courseSlug);
  if (!course) notFound();

  return (
    <>
      <Navbar />
      <PublicQuizHub courseSlug={course.slug} />
      <Footer />
    </>
  );
}
