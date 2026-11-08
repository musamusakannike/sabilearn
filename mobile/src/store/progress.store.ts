import { create } from 'zustand';
import api, { progressApi } from '@/lib/api';
import { DashboardData, ProgressStats, UserProgress } from '@/lib/types';
import {
  cacheDashboard,
  getCachedDashboard,
  getLocalCourseProgress,
  isOnline,
  queueSession,
  onOfflineSyncComplete,
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
  needsImprovement: UserProgress[];
  isLoading: boolean;
  fetchDashboard: () => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchContinueStudying: () => Promise<void>;
  fetchNeedsImprovement: () => Promise<void>;
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
  savePosition: (data: { courseId: string; chapterId?: string; topicId?: string; contentIndex: number }) => Promise<void>;
  fetchCourseProgress: (courseId: string) => Promise<{ totalTopics: number; completedTopics: number; percentComplete: number } | null>;
  fetchTopicProgress: (topicId: string) => Promise<{ lastContentIndex: number; isCompleted: boolean } | null>;
  completeTopic: (data: { courseId: string; topicId: string }) => Promise<{ success: boolean; earnedXp?: number; isCourseComplete?: boolean }>;
  submitExercise: (data: {
    courseId: string;
    topicId?: string;
    chapterId?: string;
    answers: unknown[];
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
  // Listen for background sync completion to automatically refresh authoritative server dashboard state
  onOfflineSyncComplete(async () => {
    try {
      const res = await progressApi.dashboard();
      const data = res.data.data;
      if (data) {
        set({ dashboard: data });
        void cacheDashboard(data);
      }
    } catch {
      // ignore
    }
  });

  return {
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
        if (data) {
          void cacheDashboard(data);
          const currentUserId = useAuthStore.getState().user?._id;
          void seedLocalProgressFromDashboard(data.continueStudying || [], currentUserId);
        }
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
      const currentUserId = useAuthStore.getState().user?._id;
      try {
        const online = await isOnline();
        if (!online || isBundledCourse(data.course)) {
          await saveContentPositionOffline(data, currentUserId);
          if (!online) return;
        }
        await api.post('/progress/content-position', data);
      } catch {
        // silently fail
      }
    },

    savePosition: async (data) => {
      const currentUserId = useAuthStore.getState().user?._id;
      try {
        const online = await isOnline();
        if (!online || isBundledCourse(data.courseId)) {
          await savePositionOffline(data.courseId, data, currentUserId);
          if (!online) return;
        }
        await progressApi.savePosition(data);
      } catch {
        // silently fail
      }
    },

    fetchCourseProgress: async (courseId) => {
      try {
        const online = await isOnline();
        if (online) {
          const res = await api.get(`/progress/course/${courseId}`);
          return res.data.data;
        }
      } catch {
        // Fall back to offline calculation
      }

      const currentUserId = useAuthStore.getState().user?._id;
      const local = await getLocalCourseProgress(courseId, currentUserId);
      const course = await getOfflineCourseDetail(courseId);
      const totalTopics = course?.topicCount || 0;
      const completedTopics = local.completedTopics.length;
      const percentComplete = totalTopics > 0 ? Math.min(100, Math.round((completedTopics / totalTopics) * 100)) : 0;
      return { totalTopics, completedTopics, percentComplete };
    },

    fetchTopicProgress: async (topicId) => {
      try {
        const online = await isOnline();
        if (online) {
          const res = await api.get(`/progress/topic/${topicId}`);
          return res.data.data;
        }
      } catch {
        // Fall back to offline calculation
      }

      const currentUserId = useAuthStore.getState().user?._id;
      return await getTopicProgressOffline(topicId, currentUserId);
    },

    completeTopic: async (data) => {
      const currentUserId = useAuthStore.getState().user?._id;
      try {
        const online = await isOnline();
        if (!online) {
          const offlineRes = await completeTopicOffline(data.courseId, data.topicId, currentUserId);
          return {
            success: true,
            earnedXp: offlineRes.earnedXp,
            isCourseComplete: offlineRes.isCourseComplete,
          };
        }

        // Apply locally too so optimistic local state is consistent
        void completeTopicOffline(data.courseId, data.topicId, currentUserId).catch(() => {});
        const res = await api.post('/progress/topic-complete', data);
        const serverProgress = res.data?.progress;
        return {
          success: !!res.data?.success,
          earnedXp: res.data?.earnedXp || 0,
          isCourseComplete: serverProgress?.isCompleted === true,
        };
      } catch {
        // If online attempt errored (e.g. network blip), fallback to offline completion
        try {
          const offlineRes = await completeTopicOffline(data.courseId, data.topicId, currentUserId);
          return {
            success: true,
            earnedXp: offlineRes.earnedXp,
            isCourseComplete: offlineRes.isCourseComplete,
          };
        } catch {
          return { success: false };
        }
      }
    },

    submitExercise: async (data) => {
      const currentUserId = useAuthStore.getState().user?._id;
      try {
        const online = await isOnline();
        if (!online) {
          const offRes = await submitExerciseOffline(
            {
              courseId: data.courseId,
              topicId: data.topicId,
              chapterId: data.chapterId,
              answers: data.answers as any,
              duration: data.duration,
            },
            currentUserId
          );
          return {
            success: true,
            scorePercent: offRes.scorePercent,
            isPassed: offRes.isPassed,
            earnedXp: offRes.earnedXp,
            alreadyRewarded: offRes.alreadyRewarded,
          };
        }

        const res = await api.post('/progress/exercise-submit', data);
        if (res.data?.success) {
          // Replicate in local progress state
          void submitExerciseOffline(
            {
              courseId: data.courseId,
              topicId: data.topicId,
              chapterId: data.chapterId,
              answers: data.answers as any,
              duration: data.duration,
            },
            currentUserId
          ).catch(() => {});

          return {
            success: true,
            scorePercent: res.data.scorePercent,
            isPassed: res.data.isPassed,
            earnedXp: res.data.earnedXp,
            alreadyRewarded: res.data.alreadyRewarded,
          };
        }
        return null;
      } catch {
        // Fallback to offline submit on network error
        try {
          const offRes = await submitExerciseOffline(
            {
              courseId: data.courseId,
              topicId: data.topicId,
              chapterId: data.chapterId,
              answers: data.answers as any,
              duration: data.duration,
            },
            currentUserId
          );
          return {
            success: true,
            scorePercent: offRes.scorePercent,
            isPassed: offRes.isPassed,
            earnedXp: offRes.earnedXp,
            alreadyRewarded: offRes.alreadyRewarded,
          };
        } catch {
          return null;
        }
      }
    },
  };
});
