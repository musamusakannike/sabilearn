import { PublicQuizCourse, PublicQuizTopic } from '@/types/public-quiz';
import {
  LAPLACE_COURSE_FALLBACK,
  LAPLACE_COURSE_SLUG,
} from '../uil-get311';
import { topic1DescriptiveStats } from './topic1-descriptive-stats';
import { topic2ProbabilityReliability } from './topic2-probability-reliability';
import { topic3Distributions } from './topic3-distributions';
import { topic4RegressionCorrelation } from './topic4-regression-correlation';
import { topic5BigDataCloud } from './topic5-big-data-cloud';

export const UIL_GET305_TOPICS: PublicQuizTopic[] = [
  topic1DescriptiveStats,
  topic2ProbabilityReliability,
  topic3Distributions,
  topic4RegressionCorrelation,
  topic5BigDataCloud,
];

export const uilGet305Course: PublicQuizCourse = {
  slug: 'uil-get305',
  code: 'UIL-GET 305',
  title: 'Engineering Statistics & Data Analytics',
  institution: 'University of Ilorin · 300L Engineering',
  description:
    'Calculation-focused MCQs covering Descriptive Statistics, Probability & System Reliability, Binomial/Poisson/Hypergeometric/Normal distributions, Regression & Correlation, and Big Data/Cloud Analytics.',
  topics: UIL_GET305_TOPICS,
  recommendedCourseSlug: LAPLACE_COURSE_SLUG,
  recommendedCourseFallback: LAPLACE_COURSE_FALLBACK,
  confettiThreshold: 65,
  seoKeywords: [
    'UIL GET 305',
    'UNILORIN Engineering Statistics',
    'GET 305 quiz',
    'Engineering Statistics and Data Analytics',
    'GET 305 past questions',
    'SabiLearn',
  ],
};
