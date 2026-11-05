import { create } from 'zustand';
import api from '@/lib/api';
import { DashboardData, ProgressStats, UserProgress } from '@/lib/types';
import { cacheDashboard, getCachedDashboard, isOnline, queueSession } from '@/lib/offlineSync';

interface ProgressState {
  dashboard: DashboardData | null;
  stats: ProgressStats | null;
  continueStudying: UserProgress[];
  needsImprovement: UserProgress[];
  isLoading: boolean;
  fetchDashboard: () => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchContinueStudying: () => Promise<void>;
  fetchNeedsImprovement: () => Promise<void>;
  submitFlashcardSession: (data: { course: string; topic?: string; flashcardsStudied: number; duration: number; knownCount: number; reviewCount: number }) => Promise<void>;
  submitMcqSession: (data: { course: string; topic?: string; mcqAnswered: number; mcqCorrect: number; duration: number; score: number }) => Promise<void>;
  saveContentPosition: (data: { course: string; topic: string; contentIndex: number }) => Promise<void>;
  fetchCourseProgress: (courseId: string) => Promise<{ totalTopics: number; completedTopics: number; percentComplete: number } | null>;
  fetchTopicProgress: (topicId: string) => Promise<{ lastContentIndex: number; isCompleted: boolean } | null>;
  completeTopic: (data: { courseId: string; topicId: string }) => Promise<boolean>;
  submitExercise: (data: { courseId: string; topicId?: string; chapterId?: string; answers: unknown[] }) => Promise<{ success: boolean; scorePercent?: number; isPassed?: boolean; earnedXp?: number } | null>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  dashboard: null,
  stats: null,
  continueStudying: [],
  needsImprovement: [],
  isLoading: false,

  fetchDashboard: async () => {
    set({ isLoading: true });
    if (!get().dashboard) {
      getCachedDashboard()
        .then((cached) => {
          if (cached && !get().dashboard) {
            set({ dashboard: cached });
          }
        })
        .catch(() => {});
    }
    try {
      const res = await api.get('/progress');
      const data = res.data.data;
      set({ dashboard: data, isLoading: false });
      if (data) void cacheDashboard(data);
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProgress: async () => {
    try {
      const res = await api.get('/progress/stats');
      set({ stats: res.data.data });
    } catch {
      // silently fail
    }
  },

  fetchContinueStudying: async () => {
    try {
      const res = await api.get('/progress/continue');
      set({ continueStudying: res.data.data });
    } catch {
      // silently fail
    }
  },

  fetchNeedsImprovement: async () => {
    try {
      const res = await api.get('/progress/needs-improvement');
      set({ needsImprovement: res.data.data });
    } catch {
      // silently fail
    }
  },

  submitFlashcardSession: async (data) => {
    try {
      const online = await isOnline();
      if (!online) {
        await queueSession('/progress/flashcard-session', data);
        return;
      }
      await api.post('/progress/flashcard-session', data);
    } catch {
      // silently fail
    }
  },

  submitMcqSession: async (data) => {
    try {
      const online = await isOnline();
      if (!online) {
        await queueSession('/progress/mcq-session', data);
        return;
      }
      await api.post('/progress/mcq-session', data);
    } catch {
      // silently fail
    }
  },

  saveContentPosition: async (data) => {
    try {
      const online = await isOnline();
      if (!online) {
        await queueSession('/progress/content-position', data);
        return;
      }
      await api.post('/progress/content-position', data);
    } catch {
      // silently fail — resuming exactly where the learner left off is a nice-to-have, not critical
    }
  },

  fetchCourseProgress: async (courseId) => {
    try {
      const res = await api.get(`/progress/course/${courseId}`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  fetchTopicProgress: async (topicId) => {
    try {
      const res = await api.get(`/progress/topic/${topicId}`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  completeTopic: async (data) => {
    try {
      const res = await api.post('/progress/topic-complete', data);
      return !!res.data?.success;
    } catch {
      return false;
    }
  },

  submitExercise: async (data) => {
    try {
      const res = await api.post('/progress/exercise-submit', data);
      if (res.data?.success) {
        return {
          success: true,
          scorePercent: res.data.scorePercent,
          isPassed: res.data.isPassed,
          earnedXp: res.data.earnedXp,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
}));
