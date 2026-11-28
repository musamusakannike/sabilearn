import { PublicQuizQuestion, PublicQuizTopic, RecommendedCourse } from '@/types/public-quiz';
import { shuffleArray } from '@/utils/shuffleOptions';
import { topic1Foundations } from './topic1-foundations';
import { topic2InflationTaxMoney } from './topic2-inflation-tax-money';
import { topic3TimeValueOfMoney } from './topic3-time-value-of-money';
import { topic4DecisionsLcc } from './topic4-decisions-lcc';
import { topic5Depreciation } from './topic5-depreciation';
import { topic6PublicAlternativesBcr } from './topic6-public-alternatives-bcr';

export const UIL_GET311_TOPICS: PublicQuizTopic[] = [
  topic1Foundations,
  topic2InflationTaxMoney,
  topic3TimeValueOfMoney,
  topic4DecisionsLcc,
  topic5Depreciation,
  topic6PublicAlternativesBcr,
];

export const ALL_UIL_GET311_QUESTIONS: PublicQuizQuestion[] = UIL_GET311_TOPICS.flatMap(
  (topic) => topic.questions
);

const QUESTION_MAP = new Map<string, PublicQuizQuestion>(
  ALL_UIL_GET311_QUESTIONS.map((q) => [q.id, q])
);

export const LAPLACE_COURSE_SLUG =
  'laplace-transforms-applications-engineering-mathematics-mastery';

export const LAPLACE_COURSE_FALLBACK: RecommendedCourse = {
  title: 'Laplace Transforms & Applications: Engineering Mathematics Mastery',
  slug: LAPLACE_COURSE_SLUG,
  description:
    'Master Laplace transforms step-by-step without textbook overwhelm: 7 core transform rules, operational theorems, Heaviside cover-up partial fractions, completing the square, and solving ODEs.',
  category: 'Mathematics',
  difficulty: 'intermediate',
  isFree: true,
  price: 0,
  banner:
    'https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794109683109-Laplace-Transforms-Engineering-Mastery.webp',
};

export function getTopicById(topicId: string): PublicQuizTopic | undefined {
  return UIL_GET311_TOPICS.find((t) => t.id === topicId);
}

export function buildAllQuestionsTopic(): PublicQuizTopic {
  const shuffled = shuffleArray(ALL_UIL_GET311_QUESTIONS);
  return {
    id: 'all',
    title: `All UIL-GET 311 Questions (${shuffled.length})`,
    shortTitle: 'All Questions',
    description: 'Complete shuffled UIL-GET 311 question bank across every topic.',
    icon: 'BookOpen',
    accent: 'gold',
    questions: shuffled,
  };
}

export function buildRandomQuizTopic(count = 50): PublicQuizTopic {
  const safeCount = Math.min(Math.max(1, count), ALL_UIL_GET311_QUESTIONS.length);
  const selected = shuffleArray(ALL_UIL_GET311_QUESTIONS).slice(0, safeCount);
  return {
    id: 'random',
    title: `Random Mix (${selected.length} Questions)`,
    shortTitle: 'Random Mix',
    description: `Randomly sampled ${selected.length} questions from all UIL-GET 311 topics.`,
    icon: 'BookOpen',
    accent: 'violet',
    questions: selected,
  };
}

export function buildCustomQuizTopic(
  topicIds: string[],
  count: number | 'all'
): PublicQuizTopic | undefined {
  const idSet = new Set(topicIds);
  const pool = UIL_GET311_TOPICS.filter((t) => idSet.has(t.id)).flatMap((t) => t.questions);
  if (pool.length === 0) return undefined;

  const shuffled = shuffleArray(pool);
  const selected =
    count === 'all' ? shuffled : shuffled.slice(0, Math.min(Math.max(1, count), shuffled.length));

  return {
    id: 'custom',
    title: `Custom GET 311 Quiz (${selected.length} Questions)`,
    shortTitle: 'Custom Quiz',
    description: `Custom selection across ${topicIds.length} topic(s).`,
    icon: 'BookOpen',
    accent: 'violet',
    questions: selected,
  };
}

export function reconstructQuizTopic(
  id: string,
  title: string,
  questionIds: string[]
): PublicQuizTopic | undefined {
  const questions = questionIds
    .map((qid) => QUESTION_MAP.get(qid))
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
