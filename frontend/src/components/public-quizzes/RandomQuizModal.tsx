'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shuffle, X } from 'lucide-react';
import { clearPublicQuizProgress } from '@/utils/publicQuizStorage';

interface RandomQuizModalProps {
  totalAvailable: number;
  basePath?: string;
  onClose: () => void;
}

const PRESET_COUNTS = [15, 30, 50, 100];

export default function RandomQuizModal({
  totalAvailable,
  basePath = '/public-quizzes/uil-get311',
  onClose,
}: RandomQuizModalProps) {
  const router = useRouter();
  const [count, setCount] = useState<number>(Math.min(50, totalAvailable));

  const handleStart = () => {
    clearPublicQuizProgress(`random_${count}`);
    router.push(`${basePath}/random?count=${count}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E1A]/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-xl)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 rounded-lg p-1.5 text-[var(--ink-500)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[var(--ink-900)] bg-[var(--brand-gold)] text-[var(--ink-900)]">
          <Shuffle className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-bold text-[var(--ink-900)]">Random Mix Challenge</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-700)]">
          Pull random questions across every UIL-GET 311 topic (conceptual + calculations). Pick how many questions you want:
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESET_COUNTS.filter((n) => n <= totalAvailable).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                count === n
                  ? 'border-[var(--ink-900)] bg-[var(--brand-gold)] text-[var(--ink-900)]'
                  : 'border-[var(--line)] bg-[var(--surface-sunken)]/60 text-[var(--ink-700)] hover:border-[var(--ink-900)]'
              }`}
            >
              {n} Qs
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCount(totalAvailable)}
            className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
              count === totalAvailable
                ? 'border-[var(--ink-900)] bg-[var(--brand-violet)] text-white'
                : 'border-[var(--line)] bg-[var(--surface-sunken)]/60 text-[var(--ink-700)] hover:border-[var(--ink-900)]'
            }`}
          >
            All ({totalAvailable})
          </button>
        </div>

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={handleStart}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--brand-gold)] px-4 py-3 text-sm font-bold text-[var(--ink-900)] shadow-[0_3px_0_#0E0E1A] transition-all hover:bg-[var(--brand-gold-600)]"
          >
            <Shuffle className="h-4 w-4" /> Start {count}-Question Mix
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-[var(--ink-900)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink-900)] hover:bg-[var(--surface-sunken)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
