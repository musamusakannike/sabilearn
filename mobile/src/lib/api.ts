import axios from 'axios';
import Constants from 'expo-constants';
import { getToken, deleteToken } from './secureStorage';

const DEFAULT_API_URL = 'https://api.sabilearn.online/api/v1';

const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let onUnauthorizedCallback: (() => Promise<void> | void) | null = null;

export const setOnUnauthorizedCallback = (cb: () => Promise<void> | void) => {
  onUnauthorizedCallback = cb;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthAttempt =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/forgot-password');

      await deleteToken();

      if (!isAuthAttempt && onUnauthorizedCallback) {
        try {
          await onUnauthorizedCallback();
        } catch {
          // Ignore errors during unauthorized callback cleanup
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };

// -- endpoint wrapper functions, mirroring the server's /api/v1 contract --

export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string; level: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  google: (idToken: string) => api.post('/auth/google', { idToken }),
  apple: (idToken: string) => api.post('/auth/apple', { idToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  me: () => api.get('/auth/me'),
};

export const courseApi = {
  list: (params?: Record<string, unknown>) => api.get('/courses', { params }),
  popular: () => api.get('/courses/popular'),
  get: (id: string) => api.get(`/courses/${id}`),
};

export const chapterApi = {
  byCourse: (courseId: string) => api.get(`/chapters/course/${courseId}`),
  getAssessment: (id: string) => api.get(`/chapters/${id}/assessment`),
};

export const topicApi = {
  byCourse: (courseId: string) => api.get(`/topics/course/${courseId}`),
  get: (id: string) => api.get(`/topics/${id}`),
};

export const flashcardApi = {
  byTopic: (topicId: string) => api.get(`/flashcards/topic/${topicId}`),
};

export const mcqApi = {
  byTopic: (topicId: string) => api.get(`/mcqs/topic/${topicId}`),
};

export const leaderboardApi = {
  get: (timeframe: string = '24h') => api.get('/leaderboard', { params: { timeframe } }),
};

export const progressApi = {
  dashboard: () => api.get('/progress'),
  dashboardResumption: () => api.get('/progress/dashboard-resumption'),
  stats: () => api.get('/progress/stats'),
  continueStudying: () => api.get('/progress/continue'),
  needsImprovement: () => api.get('/progress/needs-improvement'),
  completeTopic: (data: { courseId: string; topicId: string }) =>
    api.post('/progress/topic-complete', data),
  submitExercise: (data: { courseId: string; topicId?: string; chapterId?: string; answers: unknown[]; duration?: number }) =>
    api.post('/progress/exercise-submit', data),
  savePosition: (data: { courseId: string; chapterId?: string; topicId?: string; contentIndex: number }) =>
    api.post('/progress/save-position', data),
  submitFlashcardSession: (data: { course: string; topic?: string; flashcardsStudied: number; duration: number; knownCount?: number; reviewCount?: number }) =>
    api.post('/progress/flashcard-session', data),
  submitMcqSession: (data: { course: string; topic?: string; mcqAnswered: number; mcqCorrect: number; score: number; duration: number }) =>
    api.post('/progress/mcq-session', data),
  saveContentPosition: (data: { course: string; topic: string; contentIndex: number }) =>
    api.post('/progress/content-position', data),
  courseProgress: (courseId: string) => api.get(`/progress/course/${courseId}`),
  topicProgress: (topicId: string) => api.get(`/progress/topic/${topicId}`),
};

export const userApi = {
  profile: () => api.get('/users/me'),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/me', data),
  updateSettings: (data: Record<string, unknown>) => api.put('/users/me/settings', data),
  deleteAccount: () => api.delete('/users/me'),
  uploadAvatar: (data: FormData) =>
    api.post('/users/me/avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data) => data,
    }),
  registerPushToken: (data: { token: string; timezoneOffset: number }) => api.post('/users/me/push-token', data),
  removePushToken: (token: string) => api.delete('/users/me/push-token', { data: { token } }),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  remove: (id: string) => api.delete(`/notifications/${id}`),
};

export const searchApi = {
  global: (q: string) => api.get('/search', { params: { q } }),
};

export const playgroundApi = {
  list: (opts?: { full?: boolean; includeDeleted?: boolean }) =>
    api.get('/playground/projects', {
      params: {
        full: opts?.full ? 1 : undefined,
        includeDeleted: opts?.includeDeleted ? 1 : undefined,
      },
    }),
  get: (id: string) => api.get(`/playground/projects/${id}`),
  upsert: (data: {
    localId: string;
    name: string;
    kind: string;
    files: Record<string, string>;
    updatedAt: string;
    deletedAt?: string | null;
  }) => api.put('/playground/projects', data),
  rename: (id: string, name: string) => api.patch(`/playground/projects/${id}`, { name }),
  remove: (id: string) => api.delete(`/playground/projects/${id}`),
};

// Payment callback URL scheme
export const PAYMENT_CALLBACK_URL = 'sabilearn://payment-callback';

export const paymentApi = {
  initializeCoursePurchase: (courseId: string, opts?: { clientCheckout?: boolean }) =>
    api.post(`/payments/courses/${courseId}/initialize`, {
      callbackUrl: PAYMENT_CALLBACK_URL,
      clientCheckout: opts?.clientCheckout,
    }),
  initializeSubscription: (opts?: { clientCheckout?: boolean }) =>
    api.post('/payments/subscription/initialize', {
      callbackUrl: PAYMENT_CALLBACK_URL,
      clientCheckout: opts?.clientCheckout,
    }),
  initializeManualSubscription: (opts?: { clientCheckout?: boolean }) =>
    api.post('/payments/subscription/manual/initialize', {
      callbackUrl: PAYMENT_CALLBACK_URL,
      clientCheckout: opts?.clientCheckout,
    }),
  verify: (reference: string) => api.get(`/payments/verify/${reference}`),
  me: () => api.get('/payments/me'),
  syncIap: () => api.post('/payments/iap/sync'),
};

const AI_TIMEOUT_MS = 120000;

export const appReviewApi = {
  getStatus: (os?: string, version?: string) => api.get('/app-review/status', { params: { os, version } }),
};

export interface ExplainLessonParams {
  mode: 'eli5' | 'analogy' | 'custom';
  topicTitle?: string;
  stepTitle?: string;
  stepContent?: string;
  question?: string;
}

const COURSE_GENERATE_TIMEOUT_MS = 10 * 60 * 1000;

export const courseArchitectApi = {
  quota: () => api.get('/ai/course-architect/quota'),
  generateFull: (data: FormData) =>
    api.post('/ai/course-architect/generate-full', data, {
      timeout: COURSE_GENERATE_TIMEOUT_MS,
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (body) => body,
    }),
  myCourses: (params?: { page?: number; limit?: number }) =>
    api.get('/ai/courses/my-courses', { params }),
  publicCourses: (params?: Record<string, unknown>) =>
    api.get('/ai/courses/public', { params }),
  updateVisibility: (id: string, visibility: 'public' | 'unlisted' | 'private') =>
    api.patch(`/ai/courses/${id}/visibility`, { visibility }),
  deleteCourse: (id: string) => api.delete(`/ai/courses/${id}`),
};

export const aiApi = {
  summarize: (text: string, stream: boolean = false) =>
    api.post('/ai/summarize', { text, stream }, { timeout: AI_TIMEOUT_MS }),
  generateQuiz: (topic: string, count: number = 5, stream: boolean = false) =>
    api.post('/ai/generate-quiz', { topic, count, stream }, { timeout: AI_TIMEOUT_MS }),
  generateFlashcards: (topic: string, count: number = 5, stream: boolean = false) =>
    api.post('/ai/generate-flashcards', { topic, count, stream }, { timeout: AI_TIMEOUT_MS }),
  qa: (question: string, context?: string, stream: boolean = false) =>
    api.post('/ai/qa', { question, context, stream }, { timeout: AI_TIMEOUT_MS }),
  explain: (data: ExplainLessonParams & { stream?: boolean }) =>
    api.post('/ai/explain', data, { timeout: AI_TIMEOUT_MS }),
  history: (params?: { type?: string; page?: number; limit?: number }) => api.get('/ai/history', { params }),
  getHistoryById: (id: string) => api.get(`/ai/history/${id}`),
  deleteHistory: (id: string) => api.delete(`/ai/history/${id}`),
};

export function streamAiExplainMobile(
  params: ExplainLessonParams,
  onChunk: (chunk: string) => void,
  onDone?: (fullText: string) => void,
  onError?: (err: any) => void
): () => void {
  let isCancelled = false;
  const xhr = new XMLHttpRequest();

  (async () => {
    try {
      const token = await getToken();
      xhr.open('POST', `${API_BASE_URL}/ai/explain`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      let lastIndex = 0;
      let fullText = '';

      xhr.onprogress = () => {
        if (isCancelled) return;
        const newText = xhr.responseText.slice(lastIndex);
        lastIndex = xhr.responseText.length;

        const lines = newText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.chunk) {
                fullText += parsed.chunk;
                onChunk(parsed.chunk);
              }
            } catch {
              // ignore partial json
            }
          }
        }
      };

      xhr.onload = () => {
        if (isCancelled) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onDone) onDone(fullText);
        } else {
          try {
            const errJson = JSON.parse(xhr.responseText);
            if (onError) onError(new Error(errJson.message || `Request failed with status ${xhr.status}`));
          } catch {
            if (onError) onError(new Error(`Request failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        if (isCancelled) return;
        if (onError) onError(new Error('Network request failed'));
      };

      xhr.send(JSON.stringify({ ...params, stream: true }));
    } catch (err) {
      if (onError) onError(err);
    }
  })();

  return () => {
    isCancelled = true;
    xhr.abort();
  };
}

