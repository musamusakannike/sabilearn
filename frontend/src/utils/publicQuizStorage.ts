import { PublicQuizOption, SavedPublicQuizProgress } from '@/types/public-quiz';

const STORAGE_PREFIX = 'sabilearn_public_quiz_';
const EXPIRY_MS = 24 * 60 * 60 * 1000;

function makeKey(courseSlug: string, sessionKey: string): string {
  return `${STORAGE_PREFIX}${courseSlug}_${sessionKey}`;
}

export function savePublicQuizProgress(
  courseSlug: string,
  sessionKey: string,
  topicId: string,
  currentQuestionIndex: number,
  userAnswers: Record<number, string>,
  shuffledOptionsMap: Record<number, PublicQuizOption[]>,
  questionIds?: string[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: SavedPublicQuizProgress = {
      courseSlug,
      sessionKey,
      topicId,
      currentQuestionIndex,
      userAnswers,
      shuffledOptionsMap,
      questionIds,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(makeKey(courseSlug, sessionKey), JSON.stringify(payload));
  } catch {
    // Ignore storage quota / private-mode errors
  }
}

export function getPublicQuizProgress(
  courseSlug: string,
  sessionKey: string
): SavedPublicQuizProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(makeKey(courseSlug, sessionKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedPublicQuizProgress;
    if (!parsed.timestamp || Date.now() - parsed.timestamp > EXPIRY_MS) {
      clearPublicQuizProgress(courseSlug, sessionKey);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPublicQuizProgress(courseSlug: string, sessionKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(makeKey(courseSlug, sessionKey));
  } catch {
    // Ignore storage errors
  }
}
