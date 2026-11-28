import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import QuizRunner from '@/components/public-quizzes/QuizRunner';
import {
  getCourseQuestions,
  getCourseTopicById,
  getPublicQuizCourse,
} from '@/data/public-quizzes/registry';
import { fetchCourseBySlug } from '@/lib/course-server';
import { PublicQuizCourse, RecommendedCourse } from '@/types/public-quiz';
import { SITE_URL } from '@/lib/blog-server';

interface TopicQuizPageProps {
  params: Promise<{ courseSlug: string; topicId: string }>;
}

export async function generateMetadata({ params }: TopicQuizPageProps): Promise<Metadata> {
  const { courseSlug, topicId } = await params;
  const course = getPublicQuizCourse(courseSlug);
  if (!course) return { title: 'Quiz not found | SabiLearn' };

  const topic = getCourseTopicById(course, topicId);
  const totalQs = getCourseQuestions(course).length;
  const label =
    topicId === 'all'
      ? `All ${totalQs} Questions`
      : topicId === 'random'
        ? 'Random Mix Challenge'
        : topicId === 'custom'
          ? 'Custom Quiz'
          : topic?.title ?? 'Practice Quiz';

  const title = `${label} — ${course.code}: ${course.title} Quiz | SabiLearn`;
  const description =
    topic?.description ??
    `Practice ${course.code} (${course.title}) MCQs with instant feedback and worked LaTeX explanations on SabiLearn.`;
  const url = `${SITE_URL}/public-quizzes/${course.slug}/${topicId}`;

  return {
    title,
    description,
    openGraph: {
      title: `${course.code}: ${course.title} — ${label}`,
      description,
      url,
      siteName: 'SabiLearn',
      locale: 'en_NG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${course.code}: ${course.title} — ${label}`,
      description,
    },
  };
}

async function resolveRecommendedCourse(
  course: PublicQuizCourse
): Promise<RecommendedCourse | undefined> {
  if (!course.recommendedCourseSlug) return course.recommendedCourseFallback;
  try {
    const fetched = await fetchCourseBySlug(course.recommendedCourseSlug);
    if (fetched && fetched.slug) {
      return {
        title: fetched.title,
        slug: fetched.slug,
        description: fetched.description,
        category: fetched.category,
        difficulty: fetched.difficulty,
        isFree: fetched.isFree,
        price: fetched.price,
        banner: fetched.banner,
        chaptersCount: fetched.chapters?.length,
      };
    }
  } catch {
    // Fall back to verified DB snapshot
  }
  return course.recommendedCourseFallback;
}

export default async function PublicQuizTopicPage({ params }: TopicQuizPageProps) {
  const { courseSlug, topicId } = await params;
  const course = getPublicQuizCourse(courseSlug);
  if (!course) notFound();

  const recommendedCourse = await resolveRecommendedCourse(course);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--brand-gold)]" />
        </div>
      }
    >
      <QuizRunner
        courseSlug={course.slug}
        topicId={topicId}
        recommendedCourse={recommendedCourse}
      />
    </Suspense>
  );
}
