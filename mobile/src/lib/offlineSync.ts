import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';
import {
  Chapter,
  Course,
  DashboardData,
  Flashcard,
  MCQ,
  PaymentStatus,
  Topic,
  User,
} from './types';

const CACHE_KEYS = {
  USER_PROFILE: 'cache_user_profile_v1',
  PAYMENT_STATUS: 'cache_payment_status_v1',
  DASHBOARD: 'cache_dashboard',
  POPULAR_COURSES: 'cache_popular_courses',
  COURSES: 'cache_courses',
  COURSE_DETAIL: (courseId: string) => `cache_course_detail_${courseId}`,
  COURSE_CHAPTERS: (courseId: string) => `cache_course_chapters_${courseId}`,
  TOPIC_DETAIL: (topicId: string) => `cache_topic_detail_${topicId}`,
  LOCAL_COURSE_PROGRESS: (userKey: string, courseId: string) =>
    `cache_local_progress_${userKey}_${courseId}`,
  FLASHCARDS: (courseId: string) => `cache_flashcards_${courseId}`,
  MCQS: (courseId: string) => `cache_mcqs_${courseId}`,
  SESSION_QUEUE: 'session_queue',
};

export interface AssessmentSavedState {
  chapter: string;
  currentIndex: number;
  userAnswers: Record<string, string>;
  checkedSteps: Record<string, boolean>;
  updatedAt: string;
}

export interface LocalCourseProgressState {
  courseId: string;
  completedTopics: string[];
  earnedTopicIds: string[];
  passedExercises: string[];
  rewardedXpKeys: string[]; // e.g. "topic_<topicId>" or "exercise_question_<questionId>"
  lastChapter?: string;
  lastTopic?: string;
  lastContentIndex: number;
  topicPositions: Record<string, number>;
  assessmentProgress: Record<string, AssessmentSavedState>;
  percentCompleted: number;
  isCompleted: boolean;
  lastStudiedAt: string;
}

export async function cacheUserProfile(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(user));
  } catch {
    // ignore storage quota errors
  }
}

export async function getCachedUserProfile(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function clearCachedUserProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEYS.USER_PROFILE);
  } catch {
    // ignore
  }
}

export async function cachePaymentStatus(status: PaymentStatus): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.PAYMENT_STATUS, JSON.stringify(status));
  } catch {
    // ignore storage quota errors
  }
}

export async function getCachedPaymentStatus(): Promise<PaymentStatus | null> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.PAYMENT_STATUS);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheDashboard(data: DashboardData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.DASHBOARD, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

export async function getCachedDashboard(): Promise<DashboardData | null> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.DASHBOARD);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cachePopularCourses(courses: Course[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.POPULAR_COURSES, JSON.stringify(courses));
  } catch {
    // ignore storage quota errors
  }
}

export async function getCachedPopularCourses(): Promise<Course[]> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.POPULAR_COURSES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function cacheCourses(courses: Course[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.COURSES, JSON.stringify(courses));
  } catch {
    // ignore storage quota errors
  }
}

export async function getCachedCourses(): Promise<Course[]> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.COURSES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function cacheCourseDetail(courseId: string, course: Course): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.COURSE_DETAIL(courseId), JSON.stringify(course));
  } catch {
    // ignore storage quota errors
  }
}

export async function getCachedCourseDetail(courseId: string): Promise<Course | null> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.COURSE_DETAIL(courseId));
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheCourseChapters(courseId: string, chapters: Chapter[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.COURSE_CHAPTERS(courseId), JSON.stringify(chapters));
  } catch {
    // ignore storage quota errors
  }
}

export async function getCachedCourseChapters(courseId: string): Promise<Chapter[] | null> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.COURSE_CHAPTERS(courseId));
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheTopicDetail(topicId: string, topic: Topic): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.TOPIC_DETAIL(topicId), JSON.stringify(topic));
  } catch {
    // ignore storage quota errors
  }
}

export async function getCachedTopicDetail(topicId: string): Promise<Topic | null> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.TOPIC_DETAIL(topicId));
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function getLocalCourseProgress(
  courseId: string,
  userId?: string | null
): Promise<LocalCourseProgressState> {
  const userKey = userId || 'anon';
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.LOCAL_COURSE_PROGRESS(userKey, courseId));
    if (raw) {
      const parsed = JSON.parse(raw) as LocalCourseProgressState;
      return {
        courseId,
        completedTopics: Array.isArray(parsed.completedTopics) ? parsed.completedTopics : [],
        earnedTopicIds: Array.isArray(parsed.earnedTopicIds) ? parsed.earnedTopicIds : [],
        passedExercises: Array.isArray(parsed.passedExercises) ? parsed.passedExercises : [],
        rewardedXpKeys: Array.isArray(parsed.rewardedXpKeys) ? parsed.rewardedXpKeys : [],
        lastChapter: parsed.lastChapter,
        lastTopic: parsed.lastTopic,
        lastContentIndex: typeof parsed.lastContentIndex === 'number' ? parsed.lastContentIndex : 0,
        topicPositions: parsed.topicPositions || {},
        assessmentProgress: parsed.assessmentProgress || {},
        percentCompleted: typeof parsed.percentCompleted === 'number' ? parsed.percentCompleted : 0,
        isCompleted: !!parsed.isCompleted,
        lastStudiedAt: parsed.lastStudiedAt || new Date().toISOString(),
      };
    }
  } catch {
    // ignore
  }
  return {
    courseId,
    completedTopics: [],
    earnedTopicIds: [],
    passedExercises: [],
    rewardedXpKeys: [],
    lastContentIndex: 0,
    topicPositions: {},
    assessmentProgress: {},
    percentCompleted: 0,
    isCompleted: false,
    lastStudiedAt: new Date().toISOString(),
  };
}

export async function saveLocalCourseProgress(
  courseId: string,
  state: LocalCourseProgressState,
  userId?: string | null
): Promise<void> {
  const userKey = userId || 'anon';
  try {
    await AsyncStorage.setItem(
      CACHE_KEYS.LOCAL_COURSE_PROGRESS(userKey, courseId),
      JSON.stringify(state)
    );
  } catch {
    // ignore
  }
}

export async function cacheFlashcards(courseId: string, flashcards: Flashcard[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.FLASHCARDS(courseId), JSON.stringify(flashcards));
}

export async function getCachedFlashcards(courseId: string): Promise<Flashcard[]> {
  const data = await AsyncStorage.getItem(CACHE_KEYS.FLASHCARDS(courseId));
  return data ? JSON.parse(data) : [];
}

export async function cacheMcqs(courseId: string, mcqs: MCQ[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.MCQS(courseId), JSON.stringify(mcqs));
}

export async function getCachedMcqs(courseId: string): Promise<MCQ[]> {
  const data = await AsyncStorage.getItem(CACHE_KEYS.MCQS(courseId));
  return data ? JSON.parse(data) : [];
}

export type QueueMethod = 'POST' | 'PUT' | 'DELETE';

export interface QueuedSession {
  method?: QueueMethod;
  endpoint: string;
  data?: Record<string, unknown>;
  dedupeKey?: string;
  timestamp: number;
}

export async function queueSession(
  endpoint: string,
  data?: Record<string, unknown>,
  opts?: { method?: QueueMethod; dedupeKey?: string; cancelDedupeKey?: string }
): Promise<void> {
  const method = opts?.method || 'POST';
  const dedupeKey = opts?.dedupeKey;
  const cancelDedupeKey = opts?.cancelDedupeKey;

  let queue = await getQueuedSessions();

  // If this mutation cancels a prior pending mutation (e.g., DELETE assessment progress cancels pending PUT)
  if (cancelDedupeKey) {
    queue = queue.filter((item) => item.dedupeKey !== cancelDedupeKey);
  }

  // If a dedupeKey is provided, compact/replace existing pending entry with the latest state
  if (dedupeKey) {
    const existingIdx = queue.findIndex((item) => item.dedupeKey === dedupeKey);
    if (existingIdx !== -1) {
      queue[existingIdx] = {
        method,
        endpoint,
        data,
        dedupeKey,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEYS.SESSION_QUEUE, JSON.stringify(queue));
      return;
    }
  }

  queue.push({
    method,
    endpoint,
    data,
    dedupeKey,
    timestamp: Date.now(),
  });
  await AsyncStorage.setItem(CACHE_KEYS.SESSION_QUEUE, JSON.stringify(queue));
}

export async function getQueuedSessions(): Promise<QueuedSession[]> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.SESSION_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

let isSyncingQueue = false;
type SyncCompleteListener = () => void | Promise<void>;
const syncListeners = new Set<SyncCompleteListener>();

export function onOfflineSyncComplete(listener: SyncCompleteListener): () => void {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

export async function syncQueuedSessions(): Promise<boolean> {
  if (isSyncingQueue) return false;
  const online = await isOnline();
  if (!online) return false;

  const queue = await getQueuedSessions();
  if (queue.length === 0) return false;

  isSyncingQueue = true;
  let anySynced = false;

  try {
    const remaining: QueuedSession[] = [];

    for (const session of queue) {
      try {
        const method = session.method || 'POST';
        if (method === 'PUT') {
          await api.put(session.endpoint, session.data || {});
        } else if (method === 'DELETE') {
          await api.delete(session.endpoint, session.data ? { data: session.data } : undefined);
        } else {
          await api.post(session.endpoint, session.data || {});
        }
        anySynced = true;
      } catch (err: any) {
        const status = err?.response?.status;
        // Drop permanent validation / not-found errors (400, 404, 422) so they never block the queue forever
        if (status === 400 || status === 404 || status === 422) {
          continue;
        }
        remaining.push(session);
      }
    }

    await AsyncStorage.setItem(CACHE_KEYS.SESSION_QUEUE, JSON.stringify(remaining));

    if (anySynced) {
      for (const listener of syncListeners) {
        try {
          await listener();
        } catch {
          // ignore listener errors
        }
      }
    }

    return anySynced;
  } finally {
    isSyncingQueue = false;
  }
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (state.isInternetReachable === false) return false;
  return state.isConnected ?? false;
}
