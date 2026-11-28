export interface PublicQuizOption {
  id: string;
  text: string;
  whyWrong?: string;
}

export interface PublicQuizQuestion {
  id: string;
  topicId: string;
  question: string;
  options: PublicQuizOption[];
  correctAnswer: string;
  explanation: string;
  difficulty?: 'conceptual' | 'calculation';
}

export interface PublicQuizTopic {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  accent: 'gold' | 'violet' | 'emerald' | 'orange';
  questions: PublicQuizQuestion[];
}

export interface RecommendedCourse {
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty?: string;
  isFree: boolean;
  price: number;
  banner?: string;
  chaptersCount?: number;
}

export interface PublicQuizCourse {
  /** URL segment under /public-quizzes/[courseSlug] */
  slug: string;
  /** Short course code e.g. "UIL-GET 311" */
  code: string;
  /** Full course name e.g. "Engineering Economics" */
  title: string;
  /** Institution & level badge e.g. "University of Ilorin · 300L Engineering" */
  institution: string;
  /** Short description shown on hub, index card, and SEO metadata */
  description: string;
  /** All quiz topics for this course */
  topics: PublicQuizTopic[];
  /** Optional SabiLearn course slug to promote on the results screen */
  recommendedCourseSlug?: string;
  /** Fallback metadata if API fetch is unavailable */
  recommendedCourseFallback?: RecommendedCourse;
  /** Extra SEO keywords */
  seoKeywords?: string[];
  /** Minimum percentage for confetti celebration (defaults to 65) */
  confettiThreshold?: number;
}

export interface SavedPublicQuizProgress {
  courseSlug: string;
  sessionKey: string;
  topicId: string;
  currentQuestionIndex: number;
  userAnswers: Record<number, string>;
  shuffledOptionsMap: Record<number, PublicQuizOption[]>;
  questionIds?: string[];
  timestamp: number;
}
