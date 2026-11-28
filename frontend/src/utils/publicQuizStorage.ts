import { PublicQuizOption, SavedPublicQuizProgress } from '@/types/public-quiz';

const STORAGE_PREFIX = 'sabilearn_public_quiz_uil_get311_';
const EXPIRY_MS = 24 * 60 * 60 * 1000;

export function savePublicQuizProgress(
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
      sessionKey,
      topicId,
      currentQuestionIndex,
      userAnswers,
      shuffledOptionsMap,
      questionIds,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(STORAGE_PREFIX + sessionKey, JSON.stringify(payload));
  } catch {
    // Ignore storage quota / private-mode errors
  }
}

export function getPublicQuizProgress(sessionKey: string): SavedPublicQuizProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + sessionKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedPublicQuizProgress;
    if (!parsed.timestamp || Date.now() - parsed.timestamp > EXPIRY_MS) {
      clearPublicQuizProgress(sessionKey);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPublicQuizProgress(sessionKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + sessionKey);
  } catch {
    // Ignore storage errors
  }
}
