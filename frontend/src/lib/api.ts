import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sabilearn_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sabilearn_token');
      localStorage.removeItem('sabilearn_user');
      if (!window.location.pathname.startsWith('/auth/')) {
        /* eslint-disable-next-line @next/next/no-location-assign-relative-destination */
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// -- endpoint wrapper functions, mirroring the /api/v1 contract --

export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string; level: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  google: (idToken: string) => api.post('/auth/google', { idToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  requestAccountDeletion: (email: string, reason?: string) => api.post('/auth/request-account-deletion', { email, reason }),
  me: () => api.get('/auth/me'),
};

export const courseApi = {
  list: (params?: Record<string, unknown>) => api.get('/courses', { params }),
  categories: () => api.get('/courses/categories'),
  createCategory: (data: { name: string; description?: string }) => api.post('/courses/categories', data),
  popular: () => api.get('/courses/popular'),
  get: (id: string) => api.get(`/courses/${id}`),
  create: (data: FormData) => api.post('/courses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/courses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id: string) => api.delete(`/courses/${id}`),
};

export const topicApi = {
  byCourse: (courseId: string) => api.get(`/topics/course/${courseId}`),
  get: (id: string) => api.get(`/topics/${id}`),
  create: (data: Partial<import('./types').Topic>) => api.post('/topics', data),
  update: (id: string, data: Partial<import('./types').Topic>) => api.put(`/topics/${id}`, data),
  remove: (id: string) => api.delete(`/topics/${id}`),
  reorder: (data: { course?: string; order?: string[]; topicIds?: string[]; chapterId?: string }) =>
    api.put('/topics/reorder', data),
};

export const flashcardApi = {
  byTopic: (topicId: string) => api.get(`/flashcards/topic/${topicId}`),
  create: (data: Partial<import('./types').Flashcard>) => api.post('/flashcards', data),
  bulkCreate: (data: { topic: string; flashcards: { question: string; answer: string }[] }) => api.post('/flashcards/bulk', data),
  update: (id: string, data: Partial<import('./types').Flashcard>) => api.put(`/flashcards/${id}`, data),
  remove: (id: string) => api.delete(`/flashcards/${id}`),
};

export const mcqApi = {
  byTopic: (topicId: string) => api.get(`/mcqs/topic/${topicId}`),
  create: (data: Partial<import('./types').MCQ>) => api.post('/mcqs', data),
  bulkCreate: (data: { topic: string; mcqs: Partial<import('./types').MCQ>[] }) => api.post('/mcqs/bulk', data),
  update: (id: string, data: Partial<import('./types').MCQ>) => api.put(`/mcqs/${id}`, data),
  remove: (id: string) => api.delete(`/mcqs/${id}`),
};

export const chapterApi = {
  byCourse: (courseId: string) => api.get(`/chapters/course/${courseId}`),
  create: (data: Record<string, unknown>) => api.post('/chapters', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/chapters/${id}`, data),
  remove: (id: string) => api.delete(`/chapters/${id}`),
  reorder: (data: { course?: string; order?: string[]; chapterIds?: string[] }) =>
    api.put('/chapters/reorder', data),
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
  completeTopic: (data: { courseId: string; topicId: string }) => api.post('/progress/topic-complete', data),
  submitExercise: (data: { courseId: string; topicId?: string; chapterId?: string; answers: unknown[]; duration?: number }) =>
    api.post('/progress/exercise-submit', data),
  savePosition: (data: { courseId: string; chapterId?: string; topicId?: string; contentIndex: number }) =>
    api.post('/progress/save-position', data),
  submitFlashcardSession: (data: { course: string; topic: string; flashcardsStudied: number; duration: number }) =>
    api.post('/progress/flashcard-session', data),
  submitMcqSession: (data: { course: string; topic: string; mcqAnswered: number; mcqCorrect: number; score: number; duration: number }) =>
    api.post('/progress/mcq-session', data),
  saveContentPosition: (data: { course: string; topic: string; contentIndex: number }) =>
    api.post('/progress/content-position', data),
  courseProgress: (courseId: string) => api.get(`/progress/course/${courseId}`),
  topicProgress: (topicId: string) => api.get(`/progress/topic/${topicId}`),
};

export const paymentApi = {
  initializeCoursePurchase: (courseId: string) => api.post(`/payments/courses/${courseId}/initialize`),
  initializeSubscription: () => api.post('/payments/subscription/initialize'),
  initializeManualSubscription: () => api.post('/payments/subscription/manual/initialize'),
  verify: (reference: string) => api.get(`/payments/verify/${reference}`),
  me: () => api.get('/payments/me'),
};

export const userApi = {
  profile: () => api.get('/users/me'),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/me', data),
  updateSettings: (data: Record<string, unknown>) => api.put('/users/me/settings', data),
  deleteAccount: () => api.delete('/users/me'),
  uploadAvatar: (data: FormData) => api.post('/users/me/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  updateRole: (id: string, role: string) => api.put(`/users/${id}/role`, { role }),
  remove: (id: string) => api.delete(`/users/${id}`),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  create: (data: Record<string, unknown>) => api.post('/notifications', data),
  remove: (id: string) => api.delete(`/notifications/${id}`),
};

export const searchApi = {
  global: (q: string) => api.get('/search', { params: { q } }),
};

export const mediaApi = {
  upload: (data: FormData) => api.post('/media/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const blogApi = {
  list: (params?: Record<string, unknown>) => api.get('/blog', { params }),
  categories: () => api.get('/blog/categories'),
  bySlug: (slug: string) => api.get(`/blog/slug/${slug}`),
  get: (id: string) => api.get(`/blog/${id}`),
  create: (data: FormData) => api.post('/blog', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/blog/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id: string) => api.delete(`/blog/${id}`),
};

export const adminApi = {
  analytics: () => api.get('/admin/analytics'),
  coursePerformance: () => api.get('/admin/course-performance'),
  userGrowth: () => api.get('/admin/user-growth'),
  recentActivity: () => api.get('/admin/recent-activity'),
};

export const appReviewApi = {
  getStatus: (os?: string, version?: string) => api.get('/app-review/status', { params: { os, version } }),
  getAll: () => api.get('/app-review'),
  update: (os: string, data: Partial<import('./types').AppReviewConfig>) => api.put(`/app-review/${os}`, data),
  bulkUpdate: (data: { ios?: Partial<import('./types').AppReviewConfig>; android?: Partial<import('./types').AppReviewConfig> }) =>
    api.put('/app-review', data),
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

const COURSE_GENERATE_TIMEOUT_MS = 10 * 60 * 1000;

export const courseArchitectApi = {
  quota: () => api.get('/ai/course-architect/quota'),
  generateFull: (data: FormData) =>
    api.post('/ai/course-architect/generate-full', data, {
      timeout: COURSE_GENERATE_TIMEOUT_MS,
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  myCourses: (params?: { page?: number; limit?: number }) =>
    api.get('/ai/courses/my-courses', { params }),
  publicCourses: (params?: Record<string, unknown>) =>
    api.get('/ai/courses/public', { params }),
  getByIdOrSlug: (idOrSlug: string) =>
    api.get(`/ai/courses/${idOrSlug}`),
  updateVisibility: (id: string, visibility: 'public' | 'unlisted' | 'private') =>
    api.patch(`/ai/courses/${id}/visibility`, { visibility }),
  deleteCourse: (id: string) => api.delete(`/ai/courses/${id}`),
};

export interface ExplainLessonParams {
  mode: 'eli5' | 'analogy' | 'custom';
  topicTitle?: string;
  stepTitle?: string;
  stepContent?: string;
  question?: string;
}

export const aiApi = {
  summarize: (text: string, stream: boolean = false) => api.post('/ai/summarize', { text, stream }),
  generateQuiz: (topic: string, count: number = 5, stream: boolean = false) => api.post('/ai/generate-quiz', { topic, count, stream }),
  generateFlashcards: (topic: string, count: number = 5, stream: boolean = false) => api.post('/ai/generate-flashcards', { topic, count, stream }),
  qa: (question: string, context?: string, stream: boolean = false) => api.post('/ai/qa', { question, context, stream }),
  explain: (data: ExplainLessonParams & { stream?: boolean }) => api.post('/ai/explain', data),
  history: (params?: { type?: string; page?: number; limit?: number }) => api.get('/ai/history', { params }),
  getHistoryById: (id: string) => api.get(`/ai/history/${id}`),
  deleteHistory: (id: string) => api.delete(`/ai/history/${id}`),
};

export async function streamAiExplain(
  params: ExplainLessonParams,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sabilearn_token') : null;
  const url = `${API_URL}/ai/explain`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ...params, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `AI request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No readable stream available in response.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          if (parsed.chunk) {
            accumulated += parsed.chunk;
            onChunk(parsed.chunk);
          }
        } catch {
          // ignore partial JSON chunks
        }
      }
    }
  }

  return accumulated;
}

