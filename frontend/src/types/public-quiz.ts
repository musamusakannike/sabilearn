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

export interface SavedPublicQuizProgress {
  sessionKey: string;
  topicId: string;
  currentQuestionIndex: number;
  userAnswers: Record<number, string>;
  shuffledOptionsMap: Record<number, PublicQuizOption[]>;
  questionIds?: string[];
  timestamp: number;
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
