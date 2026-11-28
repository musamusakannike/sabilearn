import type { Metadata } from 'next';
import { Suspense } from 'react';
import QuizRunner from '@/components/public-quizzes/QuizRunner';
import {
  getTopicById,
  LAPLACE_COURSE_FALLBACK,
  LAPLACE_COURSE_SLUG,
} from '@/data/public-quizzes/uil-get311';
import { fetchCourseBySlug } from '@/lib/course-server';
import { RecommendedCourse } from '@/types/public-quiz';

interface TopicQuizPageProps {
  params: Promise<{ topicId: string }>;
}

export async function generateMetadata({ params }: TopicQuizPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const topic = getTopicById(topicId);
  const title =
    topicId === 'all'
      ? 'All UIL-GET 311 Questions — Practice Quiz | SabiLearn'
      : topicId === 'random'
        ? 'Random Mix — UIL-GET 311 Quiz | SabiLearn'
        : topicId === 'custom'
          ? 'Custom Quiz — UIL-GET 311 | SabiLearn'
          : topic
            ? `${topic.title} — UIL-GET 311 Quiz | SabiLearn`
            : 'UIL-GET 311 Quiz | SabiLearn';

  return {
    title,
    description:
      topic?.description ??
      'Interactive UIL-GET 311 Engineering Economics MCQ practice with instant feedback and step-by-step LaTeX explanations.',
  };
}

async function resolveLaplaceCourse(): Promise<RecommendedCourse> {
  try {
    const course = await fetchCourseBySlug(LAPLACE_COURSE_SLUG);
    if (course && course.slug) {
      return {
        title: course.title,
        slug: course.slug,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        isFree: course.isFree,
        price: course.price,
        banner: course.banner,
        chaptersCount: course.chapters?.length,
      };
    }
  } catch {
    // Fall back to verified DB snapshot
  }
  return LAPLACE_COURSE_FALLBACK;
}

export default async function UilGet311TopicQuizPage({ params }: TopicQuizPageProps) {
  const { topicId } = await params;
  const recommendedCourse = await resolveLaplaceCourse();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--brand-gold)]" />
        </div>
      }
    >
      <QuizRunner topicId={topicId} recommendedCourse={recommendedCourse} />
    </Suspense>
  );
}
