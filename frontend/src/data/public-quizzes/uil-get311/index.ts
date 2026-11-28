import { PublicQuizCourse, PublicQuizTopic, RecommendedCourse } from '@/types/public-quiz';
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

export const uilGet311Course: PublicQuizCourse = {
  slug: 'uil-get311',
  code: 'UIL-GET 311',
  title: 'Engineering Economics',
  institution: 'University of Ilorin · 300L Engineering',
  description:
    'Practice exam-style MCQs drawn directly from the UIL-GET 311 lecture notes, Depreciation slides, and class calculations — complete with instant feedback and step-by-step LaTeX explanations.',
  topics: UIL_GET311_TOPICS,
  recommendedCourseSlug: LAPLACE_COURSE_SLUG,
  recommendedCourseFallback: LAPLACE_COURSE_FALLBACK,
  confettiThreshold: 65,
  seoKeywords: [
    'UIL GET 311',
    'UNILORIN Engineering Economics',
    'GET 311 quiz',
    'GET 311 past questions',
    'Engineering Economics MCQ',
    'SabiLearn',
  ],
};
