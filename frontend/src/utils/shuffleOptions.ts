import { PublicQuizOption } from '@/types/public-quiz';

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleOptions(options: PublicQuizOption[]): PublicQuizOption[] {
  return shuffleArray(options);
}
