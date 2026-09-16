export interface IUserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyProgress: boolean;
  language: string;
  dailyGoalMinutes?: number;
}

export interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  role: 'user' | 'admin';
  totalXp?: number;
  currentStreak?: number;
  firebaseUid?: string;
  settings?: IUserSettings;
}

export type TopicContentType = 'text' | 'latex' | 'youtube' | 'image' | 'video' | 'audio' | 'code' | 'quiz' | 'exercise' | 'group';

export interface TopicQuizOption {
  text: string;
  isCorrect: boolean;
}

export interface TopicQuiz {
  question: string;
  options: TopicQuizOption[];
  explanation?: string;
}

export interface TopicExercise {
  instructions: string;
  starterCode: string;
  language: string;
  expectedOutput?: string;
  solution?: string;
  // Legacy aliases — server stores exercise as Mixed, older content may use these
  title?: string;
  prompt?: string;
}

export interface Question {
  _id?: string;
  type: 'mcq' | 'fill_in_blank' | 'code_execution';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  starterCode?: string;
  expectedOutput?: string;
  language?: string;
  xp: number;
}

export interface Exercise {
  title?: string;
  instructions?: string;
  questions: Question[];
}

export interface TopicContent {
  _id?: string;
  type: TopicContentType;
  content: string;
  language?: string;
  title?: string;
  quiz?: TopicQuiz;
  exercise?: TopicExercise;
  blocks?: TopicContent[];
}

export type TopicFlow = 'flat' | 'guided';

export interface Topic {
  _id: string;
  course: string;
  chapter?: string;
  title: string;
  description: string;
  contents: TopicContent[];
  exercise?: Exercise;
  xp?: number;
  order: number;
  isPublished: boolean;
  defaultFlow?: TopicFlow;
  flashcardCount?: number;
  mcqCount?: number;
  isUnlocked?: boolean;
  isCompleted?: boolean;
  inProgress?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  _id: string;
  course: string;
  title: string;
  description: string;
  order: number;
  exercise?: Exercise;
  status?: 'completed' | 'inprogress' | 'locked';
  progressPercent?: number;
  topics?: Topic[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseAuthor {
  name: string;
  avatar: string;
  role?: string;
  bio?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  longDescription: string;
  banner: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  authors?: CourseAuthor[];
  whatYouWillLearn: string[];
  prerequisites?: string[];
  isPublished: boolean;
  order: number;
  isFree: boolean;
  price: number;
  topicCount?: number;
  registeredUsersCount?: number;
  lessonCount?: number;
  totalObtainableXp?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  _id: string;
  topic: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

export interface MCQ {
  _id: string;
  topic: string;
  question: string;
  options: MCQOption[];
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  _id: string;
  user: string;
  course: string;
  topic: string;
  type: 'flashcard' | 'mcq';
  flashcardsStudied: number;
  mcqAnswered: number;
  mcqCorrect: number;
  duration: number;
  score: number;
  createdAt: string;
}

export interface UserProgress {
  _id: string;
  user: string;
  course: Course | string;
  topic?: Topic | string;
  lastChapter?: Chapter | string;
  lastTopic?: Topic | string;
  lastContentIndex?: number;
  completedTopics?: string[];
  completedChapters?: string[];
  passedExercises?: string[];
  percentCompleted?: number;
  isCompleted: boolean;
  flashcardsStudied?: number;
  flashcardsTotal?: number;
  mcqsAttempted?: number;
  mcqsCorrect?: number;
  accuracy?: number;
  lastStudiedAt: string;
}

export interface DashboardData {
  continueStudying: UserProgress[];
  streak?: number;
  longestStreak?: number;
  totalXp?: number;
  quickStats?: {
    totalSessions: number;
    totalFlashcards: number;
    avgAccuracy: number;
  };
}

export interface ProgressStats {
  streak: number;
  longestStreak: number;
  totalXp?: number;
  todayStudyTime: number;
  totalSessions: number;
  totalFlashcards: number;
  avgAccuracy: number;
  dailyGoal: {
    minutes: number;
    studiedMinutes: number;
    progress: number;
    met: boolean;
  };
}

export interface ResumptionData {
  resumptionCards: UserProgress[];
  totalUnfinished: number;
}

export interface LeaderboardUser {
  _id: string;
  periodXp: number;
  totalXp: number;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  level?: string;
  currentStreak?: number;
}

export interface Notification {
  _id: string;
  user: string | null;
  type: 'info' | 'success' | 'warning' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'none' | 'expired';
export type SubscriptionBillingType = 'recurring' | 'manual';

export interface PaymentStatus {
  subscription: {
    status: SubscriptionStatus;
    billingType?: SubscriptionBillingType;
    currentPeriodEnd?: string;
  };
  purchasedCourseIds: string[];
}

export interface CheckoutInitResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface BlogAuthor {
  _id: string;
  name: string;
  avatar?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: BlogAuthor | string;
  isPublished: boolean;
  publishedAt: string | null;
  readingTimeMinutes: number;
  views: number;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface VerifyResponse {
  status: TransactionStatus;
  type: 'course_purchase' | 'subscription';
}

export interface AiQuizQuestion {
  question: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  explanation: string;
}

export interface AiHistoryItem {
  _id: string;
  user: string;
  type: 'summarize' | 'quiz' | 'flashcards' | 'qa' | 'course_quiz' | 'topic_quiz';
  title: string;
  prompt: string;
  metadata?: Record<string, unknown>;
  result: AiQuizQuestion[] | string | unknown;
  createdAt: string;
  updatedAt: string;
}

export type SupportedOS = 'ios' | 'android';

export interface AppReviewConfig {
  _id?: string;
  os: SupportedOS;
  inReview: boolean;
  reviewVersion?: string;
  minVersion?: string;
  notes?: string;
  hiddenComponents: string[];
  customFlags: Record<string, boolean>;
  updatedBy?: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
  } | string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppReviewStatusResponse {
  os: string;
  inReview: boolean;
  reviewVersion?: string;
  hiddenComponents: string[];
  customFlags: Record<string, boolean>;
  all: Record<SupportedOS, AppReviewConfig>;
}

export type PlaygroundKind = 'web' | 'python';

export interface PlaygroundProject {
  id?: string;
  localId: string;
  name: string;
  kind: PlaygroundKind;
  files: Record<string, string>;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  syncState?: 'synced' | 'pending' | 'local';
}

