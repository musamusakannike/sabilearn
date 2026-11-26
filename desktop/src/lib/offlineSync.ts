import { kvStore } from '@/platform';
import { apiRequest, ApiError } from './api';
import { checkOnline } from './connectivity';
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

export const CACHE_PREFIX = 'cache_';

const CACHE_KEYS = {
  USER_PROFILE: 'cache_user_profile_v1',
  PAYMENT_STATUS: 'cache_payment_status_v1',
  DASHBOARD: 'cache_dashboard',
  POPULAR_COURSES: 'cache_popular_courses',
  COURSES: 'cache_courses',
  DOWNLOADED_COURSE_IDS: 'cache_downloaded_course_ids_v1',
  COURSE_DETAIL: (courseId: string) => `cache_course_detail_${courseId}`,
  COURSE_CHAPTERS: (courseId: string) => `cache_course_chapters_${courseId}`,
  COURSE_TOPICS: (courseId: string) => `cache_course_topics_${courseId}`,
  TOPIC_DETAIL: (topicId: string) => `cache_topic_detail_${topicId}`,
  LOCAL_COURSE_PROGRESS: (userKey: string, courseId: string) =>
    `cache_local_progress_${userKey}_${courseId}`,
  FLASHCARDS: (key: string) => `cache_flashcards_${key}`,
  MCQS: (key: string) => `cache_mcqs_${key}`,
  SESSION_QUEUE: 'session_queue_v1',
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
  rewardedXpKeys: string[];
  lastChapter?: string;
  lastTopic?: string;
  lastContentIndex: number;
  topicPositions: Record<string, number>;
  assessmentProgress: Record<string, AssessmentSavedState>;
  percentCompleted: number;
  isCompleted: boolean;
  lastStudiedAt: string;
}

export const cacheUserProfile = (user: User) => kvStore.set(CACHE_KEYS.USER_PROFILE, user);
export const getCachedUserProfile = () => kvStore.get<User>(CACHE_KEYS.USER_PROFILE);
export const clearCachedUserProfile = () => kvStore.remove(CACHE_KEYS.USER_PROFILE);

export const cachePaymentStatus = (status: PaymentStatus) =>
  kvStore.set(CACHE_KEYS.PAYMENT_STATUS, status);
export const getCachedPaymentStatus = () => kvStore.get<PaymentStatus>(CACHE_KEYS.PAYMENT_STATUS);

export const cacheDashboard = (data: DashboardData) => kvStore.set(CACHE_KEYS.DASHBOARD, data);
export const getCachedDashboard = () => kvStore.get<DashboardData>(CACHE_KEYS.DASHBOARD);

export const cachePopularCourses = (courses: Course[]) =>
  kvStore.set(CACHE_KEYS.POPULAR_COURSES, courses);
export const getCachedPopularCourses = async (): Promise<Course[]> =>
  (await kvStore.get<Course[]>(CACHE_KEYS.POPULAR_COURSES)) || [];

export const cacheCourses = (courses: Course[]) => kvStore.set(CACHE_KEYS.COURSES, courses);
export const getCachedCourses = async (): Promise<Course[]> =>
  (await kvStore.get<Course[]>(CACHE_KEYS.COURSES)) || [];

export const cacheCourseDetail = (courseId: string, course: Course) =>
  kvStore.set(CACHE_KEYS.COURSE_DETAIL(courseId), course);
export const getCachedCourseDetail = (courseId: string) =>
  kvStore.get<Course>(CACHE_KEYS.COURSE_DETAIL(courseId));

export const cacheCourseChapters = (courseId: string, chapters: Chapter[]) =>
  kvStore.set(CACHE_KEYS.COURSE_CHAPTERS(courseId), chapters);
export const getCachedCourseChapters = (courseId: string) =>
  kvStore.get<Chapter[]>(CACHE_KEYS.COURSE_CHAPTERS(courseId));

export const cacheCourseTopics = (courseId: string, topics: Topic[]) =>
  kvStore.set(CACHE_KEYS.COURSE_TOPICS(courseId), topics);
export const getCachedCourseTopics = (courseId: string) =>
  kvStore.get<Topic[]>(CACHE_KEYS.COURSE_TOPICS(courseId));

export const cacheTopicDetail = (topicId: string, topic: Topic) =>
  kvStore.set(CACHE_KEYS.TOPIC_DETAIL(topicId), topic);
export const getCachedTopicDetail = (topicId: string) =>
  kvStore.get<Topic>(CACHE_KEYS.TOPIC_DETAIL(topicId));

export const cacheFlashcards = (key: string, flashcards: Flashcard[]) =>
  kvStore.set(CACHE_KEYS.FLASHCARDS(key), flashcards);
export const getCachedFlashcards = async (key: string): Promise<Flashcard[]> =>
  (await kvStore.get<Flashcard[]>(CACHE_KEYS.FLASHCARDS(key))) || [];

export const cacheMcqs = (key: string, mcqs: MCQ[]) => kvStore.set(CACHE_KEYS.MCQS(key), mcqs);
export const getCachedMcqs = async (key: string): Promise<MCQ[]> =>
  (await kvStore.get<MCQ[]>(CACHE_KEYS.MCQS(key))) || [];

export async function getDownloadedCourseIds(): Promise<string[]> {
  return (await kvStore.get<string[]>(CACHE_KEYS.DOWNLOADED_COURSE_IDS)) || [];
}

export async function markCourseDownloaded(courseId: string): Promise<void> {
  const existing = await getDownloadedCourseIds();
  if (!existing.includes(courseId)) {
    await kvStore.set(CACHE_KEYS.DOWNLOADED_COURSE_IDS, [...existing, courseId]);
  }
}

export async function unmarkCourseDownloaded(courseId: string): Promise<void> {
  const existing = await getDownloadedCourseIds();
  await kvStore.set(
    CACHE_KEYS.DOWNLOADED_COURSE_IDS,
    existing.filter((id) => id !== courseId)
  );
}

export async function getLocalCourseProgress(
  courseId: string,
  userId?: string | null
): Promise<LocalCourseProgressState> {
  const userKey = userId || 'anon';
  const parsed = await kvStore.get<LocalCourseProgressState>(
    CACHE_KEYS.LOCAL_COURSE_PROGRESS(userKey, courseId)
  );
  if (parsed) {
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
  await kvStore.set(CACHE_KEYS.LOCAL_COURSE_PROGRESS(userKey, courseId), state);
}

export async function getCacheSizeBytes(): Promise<number> {
  return kvStore.estimateBytes(CACHE_PREFIX);
}

export async function clearOfflineCache(): Promise<void> {
  await kvStore.clearByPrefix(CACHE_PREFIX);
}

export type QueueMethod = 'POST' | 'PUT' | 'DELETE';

export interface QueuedSession {
  method?: QueueMethod;
  endpoint: string;
  data?: Record<string, unknown>;
  dedupeKey?: string;
  timestamp: number;
}

export async function getQueuedSessions(): Promise<QueuedSession[]> {
  return (await kvStore.get<QueuedSession[]>(CACHE_KEYS.SESSION_QUEUE)) || [];
}

export async function queueSession(
  endpoint: string,
  data?: Record<string, unknown>,
  opts?: { method?: QueueMethod; dedupeKey?: string; cancelDedupeKey?: string }
): Promise<number> {
  const method = opts?.method || 'POST';
  const dedupeKey = opts?.dedupeKey;
  const cancelDedupeKey = opts?.cancelDedupeKey;

  let queue = await getQueuedSessions();

  if (cancelDedupeKey) {
    queue = queue.filter((item) => item.dedupeKey !== cancelDedupeKey);
  }

  if (dedupeKey) {
    const existingIdx = queue.findIndex((item) => item.dedupeKey === dedupeKey);
    if (existingIdx !== -1) {
      queue[existingIdx] = { method, endpoint, data, dedupeKey, timestamp: Date.now() };
      await kvStore.set(CACHE_KEYS.SESSION_QUEUE, queue);
      return queue.length;
    }
  }

  queue.push({ method, endpoint, data, dedupeKey, timestamp: Date.now() });
  await kvStore.set(CACHE_KEYS.SESSION_QUEUE, queue);
  return queue.length;
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

export async function syncQueuedSessions(): Promise<{ synced: boolean; remaining: number }> {
  if (isSyncingQueue) {
    const q = await getQueuedSessions();
    return { synced: false, remaining: q.length };
  }
  const online = await checkOnline();
  const queue = await getQueuedSessions();
  if (!online || queue.length === 0) {
    return { synced: false, remaining: queue.length };
  }

  isSyncingQueue = true;
  let anySynced = false;

  try {
    const remaining: QueuedSession[] = [];
    for (const session of queue) {
      try {
        const method = session.method || 'POST';
        await apiRequest(session.endpoint, {
          method,
          body: method === 'DELETE' && !session.data ? undefined : session.data || {},
        });
        anySynced = true;
      } catch (err) {
        const status = err instanceof ApiError ? err.status : undefined;
        if (status === 400 || status === 404 || status === 422) {
          continue;
        }
        remaining.push(session);
      }
    }

    await kvStore.set(CACHE_KEYS.SESSION_QUEUE, remaining);

    if (anySynced) {
      for (const listener of syncListeners) {
        try {
          await listener();
        } catch {
          // ignore
        }
      }
    }

    return { synced: anySynced, remaining: remaining.length };
  } finally {
    isSyncingQueue = false;
  }
}

export const isOnline = () => checkOnline();
