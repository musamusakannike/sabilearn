import { create } from 'zustand';
import { progressApi } from '@/lib/api';
import { DashboardData, ProgressStats, UserProgress } from '@/lib/types';
import {
  cacheDashboard,
  getCachedDashboard,
  getLocalCourseProgress,
  isOnline,
  onOfflineSyncComplete,
  queueSession,
} from '@/lib/offlineSync';
import {
  completeTopicOffline,
  getOfflineCourseDetail,
  getTopicProgressOffline,
  isBundledCourse,
  saveContentPositionOffline,
  savePositionOffline,
  seedLocalProgressFromDashboard,
  submitExerciseOffline,
} from '@/lib/offlineCourses';
import { useAuthStore } from './auth.store';

interface ProgressState {
  dashboard: DashboardData | null;
  stats: ProgressStats | null;
  continueStudying: UserProgress[];
  isLoading: boolean;
  fetchDashboard: () => Promise<void>;
  fetchStats: () => Promise<void>;
  submitFlashcardSession: (data: {
    course: string;
    topic?: string;
    flashcardsStudied: number;
    duration: number;
    knownCount?: number;
    reviewCount?: number;
  }) => Promise<void>;
  submitMcqSession: (data: {
    course: string;
    topic?: string;
    mcqAnswered: number;
    mcqCorrect: number;
    duration: number;
    score: number;
  }) => Promise<void>;
  saveContentPosition: (data: { course: string; topic: string; contentIndex: number }) => Promise<void>;
  savePosition: (data: {
    courseId: string;
    chapterId?: string;
    topicId?: string;
    contentIndex: number;
  }) => Promise<void>;
  fetchCourseProgress: (
    courseId: string
  ) => Promise<{ totalTopics: number; completedTopics: number; percentComplete: number } | null>;
  fetchTopicProgress: (
    topicId: string
  ) => Promise<{ lastContentIndex: number; isCompleted: boolean } | null>;
  completeTopic: (data: {
    courseId: string;
    topicId: string;
  }) => Promise<{ success: boolean; earnedXp?: number; isCourseComplete?: boolean }>;
  submitExercise: (data: {
    courseId: string;
    topicId?: string;
    chapterId?: string;
    answers: { questionId: string; questionXp?: number; isCorrect: boolean }[];
    duration?: number;
  }) => Promise<{
    success: boolean;
    scorePercent?: number;
    isPassed?: boolean;
    earnedXp?: number;
    alreadyRewarded?: boolean;
  } | null>;
}

export const useProgressStore = create<ProgressState>((set, get) => {
  onOfflineSyncComplete(async () => {
    try {
      const res = await progressApi.dashboard();
      if (res?.data) {
        set({ dashboard: res.data, continueStudying: res.data.continueStudying || [] });
        void cacheDashboard(res.data);
      }
    } catch {
      // ignore
    }
  });

  const userId = () => useAuthStore.getState().user?._id || useAuthStore.getState().user?.id;

  return {
    dashboard: null,
    stats: null,
    continueStudying: [],
    isLoading: false,

    fetchDashboard: async () => {
      set({ isLoading: true });
      if (!get().dashboard) {
        const cached = await getCachedDashboard();
        if (cached && !get().dashboard) {
          set({ dashboard: cached, continueStudying: cached.continueStudying || [] });
        }
      }
      try {
        const res = await progressApi.dashboard();
        const data: DashboardData = res.data;
        set({
          dashboard: data,
          continueStudying: data?.continueStudying || [],
          isLoading: false,
        });
        if (data) {
          void cacheDashboard(data);
          void seedLocalProgressFromDashboard(data.continueStudying || [], userId());
        }
      } catch {
        set({ isLoading: false });
      }
    },

    fetchStats: async () => {
      try {
        const res = await progressApi.stats();
        if (res.data) set({ stats: res.data });
      } catch {
        // ignore offline
      }
    },

    submitFlashcardSession: async (data) => {
      try {
        if (!(await isOnline())) {
          await queueSession('/progress/flashcard-session', data);
          return;
        }
        await progressApi.submitFlashcardSession(data);
      } catch {
        await queueSession('/progress/flashcard-session', data);
      }
    },

    submitMcqSession: async (data) => {
      try {
        if (!(await isOnline())) {
          await queueSession('/progress/mcq-session', data);
          return;
        }
        await progressApi.submitMcqSession(data);
      } catch {
        await queueSession('/progress/mcq-session', data);
      }
    },

    saveContentPosition: async (data) => {
      try {
        const online = await isOnline();
        if (!online || isBundledCourse(data.course)) {
          await saveContentPositionOffline(data, userId());
          if (!online) return;
        }
        await progressApi.saveContentPosition(data);
      } catch {
        await saveContentPositionOffline(data, userId());
      }
    },

    savePosition: async (data) => {
      try {
        const online = await isOnline();
        if (!online || isBundledCourse(data.courseId)) {
          await savePositionOffline(data.courseId, data, userId());
          if (!online) return;
        }
        await progressApi.savePosition(data);
      } catch {
        await savePositionOffline(data.courseId, data, userId());
      }
    },

    fetchCourseProgress: async (courseId) => {
      try {
        if (await isOnline()) {
          const res = await progressApi.courseProgress(courseId);
          return res.data;
        }
      } catch {
        // fallback below
      }
      const local = await getLocalCourseProgress(courseId, userId());
      const course = await getOfflineCourseDetail(courseId);
      const totalTopics = course?.topicCount || 0;
      const completedTopics = local.completedTopics.length;
      const percentComplete =
        totalTopics > 0 ? Math.min(100, Math.round((completedTopics / totalTopics) * 100)) : 0;
      return { totalTopics, completedTopics, percentComplete };
    },

    fetchTopicProgress: async (topicId) => {
      try {
        if (await isOnline()) {
          const res = await progressApi.topicProgress(topicId);
          return res.data;
        }
      } catch {
        // fallback below
      }
      return getTopicProgressOffline(topicId, userId());
    },

    completeTopic: async (data) => {
      try {
        const online = await isOnline();
        if (!online) {
          const off = await completeTopicOffline(data.courseId, data.topicId, userId());
          return { success: true, earnedXp: off.earnedXp, isCourseComplete: off.isCourseComplete };
        }
        void completeTopicOffline(data.courseId, data.topicId, userId()).catch(() => {});
        const res = await progressApi.completeTopic(data);
        return {
          success: !!res.success,
          earnedXp: res.earnedXp || 0,
          isCourseComplete: res.progress?.isCompleted === true,
        };
      } catch {
        try {
          const off = await completeTopicOffline(data.courseId, data.topicId, userId());
          return { success: true, earnedXp: off.earnedXp, isCourseComplete: off.isCourseComplete };
        } catch {
          return { success: false };
        }
      }
    },

    submitExercise: async (data) => {
      try {
        const online = await isOnline();
        if (!online) {
          const off = await submitExerciseOffline(data, userId());
          return {
            success: true,
            scorePercent: off.scorePercent,
            isPassed: off.isPassed,
            earnedXp: off.earnedXp,
            alreadyRewarded: off.alreadyRewarded,
          };
        }
        const res = await progressApi.submitExercise(data);
        if (res?.success) {
          void submitExerciseOffline(data, userId()).catch(() => {});
          return {
            success: true,
            scorePercent: res.scorePercent,
            isPassed: res.isPassed,
            earnedXp: res.earnedXp,
            alreadyRewarded: res.alreadyRewarded,
          };
        }
        return null;
      } catch {
        try {
          const off = await submitExerciseOffline(data, userId());
          return {
            success: true,
            scorePercent: off.scorePercent,
            isPassed: off.isPassed,
            earnedXp: off.earnedXp,
            alreadyRewarded: off.alreadyRewarded,
          };
        } catch {
          return null;
        }
      }
    },
  };
});
