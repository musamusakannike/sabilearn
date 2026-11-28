'use client';

import { CheckCircle2, Circle, SkipForward, XCircle } from 'lucide-react';
import { PublicQuizQuestion } from '@/types/public-quiz';

interface QuizOverviewProps {
  questions: PublicQuizQuestion[];
  userAnswers: Record<number, string>;
  currentQuestionIndex: number;
  maxReachedIndex: number;
  onQuestionClick: (index: number) => void;
}

export default function QuizOverview({
  questions,
  userAnswers,
  currentQuestionIndex,
  maxReachedIndex,
  onQuestionClick,
}: QuizOverviewProps) {
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.keys(userAnswers).reduce((acc, key) => {
    const idx = Number(key);
    return userAnswers[idx] === questions[idx]?.correctAnswer ? acc + 1 : acc;
  }, 0);
  const wrongCount = answeredCount - correctCount;
  const skippedCount = questions.reduce((acc, _, idx) => {
    if (idx <= maxReachedIndex && userAnswers[idx] === undefined && idx !== currentQuestionIndex) {
      return acc + 1;
    }
    return acc;
  }, 0);
  const remainingCount = Math.max(0, questions.length - answeredCount - skippedCount);

  return (
    <aside className="w-full lg:sticky lg:top-6 lg:w-72 lg:shrink-0">
      <div className="rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--ink-900)]">Question Map</h3>
          <span className="text-xs font-semibold text-[var(--ink-500)]">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="mb-4 grid max-h-64 grid-cols-6 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-8 lg:grid-cols-5">
          {questions.map((q, index) => {
            const answer = userAnswers[index];
            const isCurrent = index === currentQuestionIndex;
            const isVisited = index <= maxReachedIndex;

            let btnStyle =
              'border-[var(--line)] bg-[var(--surface-sunken)]/60 text-[var(--ink-500)]';
            if (answer !== undefined) {
              btnStyle =
                answer === q.correctAnswer
                  ? 'border-[#10B981] bg-emerald-100 text-emerald-900 font-bold'
                  : 'border-[#E5484D] bg-red-100 text-red-900 font-bold';
            } else if (isVisited && !isCurrent) {
              btnStyle = 'border-[#E8890C] bg-amber-100 text-amber-900 font-semibold';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onQuestionClick(index)}
                className={`flex h-9 w-full items-center justify-center rounded-lg border text-xs transition-all ${btnStyle} ${
                  isCurrent
                    ? 'ring-2 ring-[var(--ink-900)] ring-offset-1 font-extrabold'
                    : 'hover:border-[var(--ink-900)]'
                }`}
                title={`Jump to Question ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-[var(--line)] pt-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-[var(--ink-700)]">
              <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> Correct
            </span>
            <span className="font-bold text-[var(--ink-900)]">{correctCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-[var(--ink-700)]">
              <XCircle className="h-4 w-4 text-[#E5484D]" /> Wrong
            </span>
            <span className="font-bold text-[var(--ink-900)]">{wrongCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-[var(--ink-700)]">
              <SkipForward className="h-4 w-4 text-[#E8890C]" /> Skipped
            </span>
            <span className="font-bold text-[var(--ink-900)]">{skippedCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-[var(--ink-700)]">
              <Circle className="h-4 w-4 text-[var(--ink-300)]" /> Remaining
            </span>
            <span className="font-bold text-[var(--ink-900)]">{remainingCount}</span>
          </div>
        </div>

        <div className="mt-4 hidden rounded-xl bg-[var(--surface-sunken)]/70 p-3 text-[11px] leading-relaxed text-[var(--ink-500)] lg:block">
          <span className="font-bold text-[var(--ink-700)]">Shortcuts:</span>{' '}
          <kbd className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-[var(--ink-900)]">A–D</kbd>{' '}
          or{' '}
          <kbd className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-[var(--ink-900)]">1–4</kbd>{' '}
          pick ·{' '}
          <kbd className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-[var(--ink-900)]">N</kbd>{' '}
          next ·{' '}
          <kbd className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-[var(--ink-900)]">P</kbd>{' '}
          prev ·{' '}
          <kbd className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-[var(--ink-900)]">S</kbd>{' '}
          skip
        </div>
      </div>
    </aside>
  );
}
