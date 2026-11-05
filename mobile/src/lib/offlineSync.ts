import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';
import { Course, DashboardData, Flashcard, MCQ } from './types';

const CACHE_KEYS = {
  DASHBOARD: 'cache_dashboard',
  POPULAR_COURSES: 'cache_popular_courses',
  COURSES: 'cache_courses',
  FLASHCARDS: (courseId: string) => `cache_flashcards_${courseId}`,
  MCQS: (courseId: string) => `cache_mcqs_${courseId}`,
  SESSION_QUEUE: 'session_queue',
};

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
  await AsyncStorage.setItem(CACHE_KEYS.COURSES, JSON.stringify(courses));
}

export async function getCachedCourses(): Promise<Course[]> {
  const data = await AsyncStorage.getItem(CACHE_KEYS.COURSES);
  return data ? JSON.parse(data) : [];
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

interface QueuedSession {
  endpoint: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export async function queueSession(endpoint: string, data: Record<string, unknown>): Promise<void> {
  const queue = await getQueuedSessions();
  queue.push({ endpoint, data, timestamp: Date.now() });
  await AsyncStorage.setItem(CACHE_KEYS.SESSION_QUEUE, JSON.stringify(queue));
}

export async function getQueuedSessions(): Promise<QueuedSession[]> {
  const data = await AsyncStorage.getItem(CACHE_KEYS.SESSION_QUEUE);
  return data ? JSON.parse(data) : [];
}

export async function syncQueuedSessions(): Promise<void> {
  const queue = await getQueuedSessions();
  if (queue.length === 0) return;

  const remaining: QueuedSession[] = [];

  for (const session of queue) {
    try {
      await api.post(session.endpoint, session.data);
    } catch {
      remaining.push(session);
    }
  }

  await AsyncStorage.setItem(CACHE_KEYS.SESSION_QUEUE, JSON.stringify(remaining));
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}
