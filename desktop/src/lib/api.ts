import { isTauri, platformFetch, secureStore } from '@/platform';
import { markOnlineState } from './connectivity';

const PROD_API_URL = 'https://api.sabilearn.online/api/v1';

export function getApiBaseUrl(): string {
  // In browser dev mode, route through Vite's proxy to avoid CORS issues
  if (!isTauri() && import.meta.env.DEV) {
    return '/api/v1';
  }
  return (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || PROD_API_URL;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const AI_TIMEOUT_MS = 120_000;
const LONG_AI_TIMEOUT_MS = 10 * 60 * 1000;

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let onUnauthorizedCallback: (() => Promise<void> | void) | null = null;

export function setOnUnauthorizedCallback(cb: () => Promise<void> | void): void {
  onUnauthorizedCallback = cb;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${base}${cleanPath}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        qs.set(k, String(v));
      }
    }
    const queryStr = qs.toString();
    if (queryStr) {
      url += (url.includes('?') ? '&' : '?') + queryStr;
    }
  }
  return url;
}

export async function apiRequest<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = opts;
  const token = await secureStore.getToken();

  const headers: Record<string, string> = {
    'X-Client-Platform': 'web',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let fetchBody: BodyInit | undefined;
  if (body instanceof FormData) {
    fetchBody = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await platformFetch(buildUrl(path, params), {
      method,
      headers,
      body: fetchBody,
      timeoutMs,
      signal,
    });
    markOnlineState(true);
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') {
      markOnlineState(false);
    }
    throw err;
  }

  const text = await response.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  }

  if (response.status === 401) {
    const isAuthAttempt =
      path.includes('/auth/login') ||
      path.includes('/auth/register') ||
      path.includes('/auth/forgot-password');

    await secureStore.deleteToken();
    if (!isAuthAttempt && onUnauthorizedCallback) {
      try {
        await onUnauthorizedCallback();
      } catch {
        // ignore cleanup error
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(
      json?.message || `Request failed with status ${response.status}`,
      response.status,
      json
    );
  }

  return json as T;
}

// --- Pure SSE chunk parser (also unit tested) ---
export interface ParsedSseEvent {
  done: boolean;
  chunk?: string;
  raw?: Record<string, unknown>;
}

export function parseSseLines(buffer: string): { events: ParsedSseEvent[]; remainder: string } {
  const lines = buffer.split('\n');
  const remainder = lines.pop() ?? '';
  const events: ParsedSseEvent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) continue;
    if (trimmed === 'data: [DONE]' || trimmed === 'data:[DONE]') {
      events.push({ done: true });
      continue;
    }
    if (trimmed.startsWith('data:')) {
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      if (payload === '[DONE]') {
        events.push({ done: true });
        continue;
      }
      try {
        const parsed = JSON.parse(payload) as Record<string, unknown>;
        events.push({
          done: false,
          chunk: typeof parsed.chunk === 'string' ? parsed.chunk : undefined,
          raw: parsed,
        });
      } catch {
        // ignore malformed partial JSON
      }
    }
  }

  return { events, remainder };
}

export interface ExplainLessonParams {
  mode: 'eli5' | 'analogy' | 'custom';
  topicTitle?: string;
  stepTitle?: string;
  stepContent?: string;
  question?: string;
}

export function streamAiExplain(
  params: ExplainLessonParams,
  callbacks: {
    onChunk: (chunk: string) => void;
    onDone?: (fullText: string) => void;
    onError?: (err: Error) => void;
  }
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const token = await secureStore.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Client-Platform': 'web',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await platformFetch(buildUrl('/ai/explain'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...params, stream: true }),
        timeoutMs: AI_TIMEOUT_MS,
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let msg = `Request failed (${res.status})`;
        try {
          msg = JSON.parse(errText)?.message || msg;
        } catch {
          // ignore
        }
        throw new ApiError(msg, res.status);
      }

      if (!res.body) {
        const text = await res.text();
        let full = text;
        try {
          const parsed = JSON.parse(text);
          full = parsed.data || parsed.explanation || text;
        } catch {
          // plain text
        }
        callbacks.onChunk(full);
        callbacks.onDone?.(full);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, remainder } = parseSseLines(buffer);
        buffer = remainder;
        for (const ev of events) {
          if (ev.chunk) {
            fullText += ev.chunk;
            callbacks.onChunk(ev.chunk);
          }
        }
      }

      if (buffer.trim()) {
        const { events } = parseSseLines(buffer + '\n');
        for (const ev of events) {
          if (ev.chunk) {
            fullText += ev.chunk;
            callbacks.onChunk(ev.chunk);
          }
        }
      }

      callbacks.onDone?.(fullText);
    } catch (err) {
      if (controller.signal.aborted) return;
      callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => controller.abort();
}

export interface CourseArchitectProgressEvent {
  status?: string;
  stage?: string;
  percent?: number;
  message?: string;
  courseId?: string;
  error?: string;
}

/**
 * Watches Course Architect job progress via SSE with automatic polling fallback.
 */
export function watchCourseArchitectJob(
  jobId: string,
  callbacks: {
    onProgress: (ev: CourseArchitectProgressEvent) => void;
    onComplete: (ev: CourseArchitectProgressEvent) => void;
    onError: (err: Error) => void;
  }
): () => void {
  const controller = new AbortController();
  let stopped = false;

  const startPolling = async () => {
    while (!stopped && !controller.signal.aborted) {
      try {
        const res = await apiRequest<{ data?: CourseArchitectProgressEvent }>(
          `/ai/course-architect/jobs/${jobId}`,
          { signal: controller.signal }
        );
        const ev = res?.data || (res as unknown as CourseArchitectProgressEvent);
        callbacks.onProgress(ev);
        if (ev.status === 'completed' || ev.courseId) {
          callbacks.onComplete(ev);
          return;
        }
        if (ev.status === 'failed' || ev.error) {
          callbacks.onError(new Error(ev.error || 'Course generation failed'));
          return;
        }
      } catch (err) {
        if (stopped || controller.signal.aborted) return;
        // continue retrying transient network blips
        void err;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  };

  (async () => {
    try {
      const res = await platformFetch(buildUrl(`/ai/course-architect/progress/${jobId}`), {
        method: 'GET',
        headers: { Accept: 'text/event-stream', 'X-Client-Platform': 'web' },
        timeoutMs: LONG_AI_TIMEOUT_MS,
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        void startPolling();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, remainder } = parseSseLines(buffer);
        buffer = remainder;
        for (const ev of events) {
          if (ev.raw) {
            const p = ev.raw as CourseArchitectProgressEvent;
            callbacks.onProgress(p);
            if (p.status === 'completed' || p.courseId) {
              callbacks.onComplete(p);
              return;
            }
            if (p.status === 'failed' || p.error) {
              callbacks.onError(new Error(p.error || 'Course generation failed'));
              return;
            }
          }
        }
      }
    } catch {
      if (!stopped && !controller.signal.aborted) {
        void startPolling();
      }
    }
  })();

  return () => {
    stopped = true;
    controller.abort();
  };
}

// --- Typed API endpoint wrappers ---

export const authApi = {
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    level: string;
  }) => apiRequest('/auth/register', { method: 'POST', body: data }),
  login: (email: string, password: string) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
  google: (idToken: string) => apiRequest('/auth/google', { method: 'POST', body: { idToken } }),
  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  me: () => apiRequest('/auth/me'),
};

export const courseApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest('/courses', { params }),
  popular: () => apiRequest('/courses/popular'),
  get: (id: string) => apiRequest(`/courses/${id}`),
};

export const chapterApi = {
  byCourse: (courseId: string) => apiRequest(`/chapters/course/${courseId}`),
  getAssessment: (id: string) => apiRequest(`/chapters/${id}/assessment`),
};

export const topicApi = {
  byCourse: (courseId: string) => apiRequest(`/topics/course/${courseId}`),
  get: (id: string) => apiRequest(`/topics/${id}`),
};

export const flashcardApi = {
  byTopic: (topicId: string) => apiRequest(`/flashcards/topic/${topicId}`),
};

export const mcqApi = {
  byTopic: (topicId: string) => apiRequest(`/mcqs/topic/${topicId}`),
};

export const leaderboardApi = {
  get: (timeframe: string = '24h') => apiRequest('/leaderboard', { params: { timeframe } }),
};

export const progressApi = {
  dashboard: () => apiRequest('/progress'),
  stats: () => apiRequest('/progress/stats'),
  continueStudying: () => apiRequest('/progress/continue'),
  needsImprovement: () => apiRequest('/progress/needs-improvement'),
  completeTopic: (data: { courseId: string; topicId: string }) =>
    apiRequest('/progress/topic-complete', { method: 'POST', body: data }),
  submitExercise: (data: {
    courseId: string;
    topicId?: string;
    chapterId?: string;
    answers: unknown[];
    duration?: number;
  }) => apiRequest('/progress/exercise-submit', { method: 'POST', body: data }),
  savePosition: (data: {
    courseId: string;
    chapterId?: string;
    topicId?: string;
    contentIndex: number;
  }) => apiRequest('/progress/save-position', { method: 'POST', body: data }),
  submitFlashcardSession: (data: {
    course: string;
    topic?: string;
    flashcardsStudied: number;
    duration: number;
    knownCount?: number;
    reviewCount?: number;
  }) => apiRequest('/progress/flashcard-session', { method: 'POST', body: data }),
  submitMcqSession: (data: {
    course: string;
    topic?: string;
    mcqAnswered: number;
    mcqCorrect: number;
    score: number;
    duration: number;
  }) => apiRequest('/progress/mcq-session', { method: 'POST', body: data }),
  saveContentPosition: (data: { course: string; topic: string; contentIndex: number }) =>
    apiRequest('/progress/content-position', { method: 'POST', body: data }),
  courseProgress: (courseId: string) => apiRequest(`/progress/course/${courseId}`),
  topicProgress: (topicId: string) => apiRequest(`/progress/topic/${topicId}`),
  assessmentProgress: (chapterId: string) => apiRequest(`/progress/assessment/${chapterId}`),
  saveAssessmentProgress: (
    chapterId: string,
    data: {
      currentIndex: number;
      userAnswers: Record<number, string>;
      checkedSteps: Record<number, boolean>;
    }
  ) => apiRequest(`/progress/assessment/${chapterId}`, { method: 'PUT', body: data }),
  clearAssessmentProgress: (chapterId: string) =>
    apiRequest(`/progress/assessment/${chapterId}`, { method: 'DELETE' }),
};

export const userApi = {
  profile: () => apiRequest('/users/me'),
  updateProfile: (data: Record<string, unknown>) =>
    apiRequest('/users/me', { method: 'PUT', body: data }),
  updateSettings: (data: Record<string, unknown>) =>
    apiRequest('/users/me/settings', { method: 'PUT', body: data }),
  deleteAccount: () => apiRequest('/users/me', { method: 'DELETE' }),
  uploadAvatar: (formData: FormData) =>
    apiRequest('/users/me/avatar', { method: 'POST', body: formData, timeoutMs: 60_000 }),
};

// Note: DELETE /notifications/:id is intentionally omitted because it is admin-only on the server.
export const notificationApi = {
  list: () => apiRequest('/notifications'),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  markRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
};

export const searchApi = {
  global: (q: string) => apiRequest('/search', { params: { q } }),
};

export const playgroundApi = {
  list: (opts?: { full?: boolean; includeDeleted?: boolean }) =>
    apiRequest('/playground/projects', {
      params: {
        full: opts?.full ? 1 : undefined,
        includeDeleted: opts?.includeDeleted ? 1 : undefined,
      },
    }),
  get: (id: string) => apiRequest(`/playground/projects/${id}`),
  upsert: (data: {
    localId: string;
    name: string;
    kind: string;
    files: Record<string, string>;
    updatedAt: string;
    deletedAt?: string | null;
  }) => apiRequest('/playground/projects', { method: 'PUT', body: data }),
  rename: (id: string, name: string) =>
    apiRequest(`/playground/projects/${id}`, { method: 'PATCH', body: { name } }),
  remove: (id: string) => apiRequest(`/playground/projects/${id}`, { method: 'DELETE' }),
};

export const DESKTOP_PAYMENT_CALLBACK_URL = 'sabilearn://payment-callback';

export const paymentApi = {
  initializeCoursePurchase: (courseId: string) =>
    apiRequest(`/payments/courses/${courseId}/initialize`, {
      method: 'POST',
      body: { callbackUrl: DESKTOP_PAYMENT_CALLBACK_URL },
    }),
  initializeSubscription: () =>
    apiRequest('/payments/subscription/initialize', {
      method: 'POST',
      body: { callbackUrl: DESKTOP_PAYMENT_CALLBACK_URL },
    }),
  initializeManualSubscription: () =>
    apiRequest('/payments/subscription/manual/initialize', {
      method: 'POST',
      body: { callbackUrl: DESKTOP_PAYMENT_CALLBACK_URL },
    }),
  verify: (reference: string) => apiRequest(`/payments/verify/${reference}`),
  me: () => apiRequest('/payments/me'),
};

export const courseArchitectApi = {
  quota: () => apiRequest('/ai/course-architect/quota'),
  generateFull: (formData: FormData) =>
    apiRequest('/ai/course-architect/generate-full', {
      method: 'POST',
      body: formData,
      timeoutMs: LONG_AI_TIMEOUT_MS,
    }),
  myCourses: (params?: { page?: number; limit?: number }) =>
    apiRequest('/ai/courses/my-courses', { params }),
  publicCourses: (params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest('/ai/courses/public', { params }),
  updateVisibility: (id: string, visibility: 'public' | 'unlisted' | 'private') =>
    apiRequest(`/ai/courses/${id}/visibility`, { method: 'PATCH', body: { visibility } }),
  deleteCourse: (id: string) => apiRequest(`/ai/courses/${id}`, { method: 'DELETE' }),
};

export const aiApi = {
  summarize: (text: string) =>
    apiRequest('/ai/summarize', { method: 'POST', body: { text, stream: false }, timeoutMs: AI_TIMEOUT_MS }),
  generateQuiz: (topic: string, count: number = 5) =>
    apiRequest('/ai/generate-quiz', {
      method: 'POST',
      body: { topic, count, stream: false },
      timeoutMs: AI_TIMEOUT_MS,
    }),
  generateQuizFromMaterials: (formData: FormData) =>
    apiRequest('/ai/generate-quiz/materials', {
      method: 'POST',
      body: formData,
      timeoutMs: LONG_AI_TIMEOUT_MS,
    }),
  generateFlashcards: (topic: string, count: number = 5) =>
    apiRequest('/ai/generate-flashcards', {
      method: 'POST',
      body: { topic, count, stream: false },
      timeoutMs: AI_TIMEOUT_MS,
    }),
  qa: (question: string, context?: string) =>
    apiRequest('/ai/qa', {
      method: 'POST',
      body: { question, context, stream: false },
      timeoutMs: AI_TIMEOUT_MS,
    }),
  history: (params?: { type?: string; page?: number; limit?: number }) =>
    apiRequest('/ai/history', { params }),
  getHistoryById: (id: string) => apiRequest(`/ai/history/${id}`),
  deleteHistory: (id: string) => apiRequest(`/ai/history/${id}`, { method: 'DELETE' }),
};
