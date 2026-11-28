import { PublicQuizCourse, PublicQuizQuestion, PublicQuizTopic } from '@/types/public-quiz';
import { shuffleArray } from '@/utils/shuffleOptions';
import { uilGet311Course } from './uil-get311';

/**
 * Central registry of all public course quizzes.
 *
 * To add a new course quiz:
 * 1. Create `src/data/public-quizzes/<your-slug>/index.ts` exporting a `PublicQuizCourse`.
 * 2. Import and append it to `PUBLIC_QUIZ_COURSES` below.
 *
 * Hub page, topic runner, dynamic OG image, metadata, and sitemap update automatically.
 */
export const PUBLIC_QUIZ_COURSES: PublicQuizCourse[] = [uilGet311Course];

const COURSE_MAP = new Map<string, PublicQuizCourse>(
  PUBLIC_QUIZ_COURSES.map((course) => [course.slug, course])
);

export function getPublicQuizCourse(slug: string): PublicQuizCourse | undefined {
  return COURSE_MAP.get(slug);
}

export function getAllPublicQuizSlugs(): string[] {
  return PUBLIC_QUIZ_COURSES.map((c) => c.slug);
}

export function getCourseQuestions(course: PublicQuizCourse): PublicQuizQuestion[] {
  return course.topics.flatMap((topic) => topic.questions);
}

export function getCourseTopicById(
  course: PublicQuizCourse,
  topicId: string
): PublicQuizTopic | undefined {
  return course.topics.find((t) => t.id === topicId);
}

export function buildCourseAllQuestionsTopic(course: PublicQuizCourse): PublicQuizTopic {
  const shuffled = shuffleArray(getCourseQuestions(course));
  return {
    id: 'all',
    title: `All ${course.code} Questions (${shuffled.length})`,
    shortTitle: 'All Questions',
    description: `Complete shuffled ${course.code} question bank across every topic.`,
    icon: 'BookOpen',
    accent: 'gold',
    questions: shuffled,
  };
}

export function buildCourseRandomQuizTopic(
  course: PublicQuizCourse,
  count = 50
): PublicQuizTopic {
  const all = getCourseQuestions(course);
  const safeCount = Math.min(Math.max(1, count), all.length);
  const selected = shuffleArray(all).slice(0, safeCount);
  return {
    id: 'random',
    title: `Random Mix (${selected.length} Questions)`,
    shortTitle: 'Random Mix',
    description: `Randomly sampled ${selected.length} questions from all ${course.code} topics.`,
    icon: 'BookOpen',
    accent: 'violet',
    questions: selected,
  };
}

export function buildCourseCustomQuizTopic(
  course: PublicQuizCourse,
  topicIds: string[],
  count: number | 'all'
): PublicQuizTopic | undefined {
  const idSet = new Set(topicIds);
  const pool = course.topics.filter((t) => idSet.has(t.id)).flatMap((t) => t.questions);
  if (pool.length === 0) return undefined;

  const shuffled = shuffleArray(pool);
  const selected =
    count === 'all'
      ? shuffled
      : shuffled.slice(0, Math.min(Math.max(1, count), shuffled.length));

  return {
    id: 'custom',
    title: `Custom ${course.code} Quiz (${selected.length} Questions)`,
    shortTitle: 'Custom Quiz',
    description: `Custom selection across ${topicIds.length} topic(s).`,
    icon: 'BookOpen',
    accent: 'violet',
    questions: selected,
  };
}

export function reconstructCourseQuizTopic(
  course: PublicQuizCourse,
  id: string,
  title: string,
  questionIds: string[]
): PublicQuizTopic | undefined {
  const qMap = new Map(getCourseQuestions(course).map((q) => [q.id, q]));
  const questions = questionIds
    .map((qid) => qMap.get(qid))
    .filter((q): q is PublicQuizQuestion => Boolean(q));
  if (questions.length === 0) return undefined;
  return {
    id,
    title,
    shortTitle: title,
    description: 'Restored quiz session.',
    icon: 'BookOpen',
    accent: 'gold',
    questions,
  };
}
