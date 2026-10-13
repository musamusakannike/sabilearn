'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, RotateCcw, X } from 'lucide-react';
import {
  GUEST_MAX_QUESTIONS,
  buildSession,
  getSwepQuiz,
  parseUnitParam,
  parseYearParam,
  unitLabel,
} from '@/lib/swep';
import type { SwepOption, SwepQuestion } from '@/lib/swep';

type Phase = 'quiz' | 'results';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function shuffleOptions(options: SwepOption[]): SwepOption[] {
  const array = [...options];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function QuizQuestion({
  question,
  options,
  selected,
  checked,
  yearLabel,
  onSelect,
}: {
  question: SwepQuestion;
  options: SwepOption[];
  selected: number | null;
  checked: boolean;
  yearLabel: string;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-[var(--ink-500)]">
          {yearLabel} · {question.unitName} · Q{question.questionNumber}
        </p>
        <p className="mt-2 text-lg leading-snug font-semibold text-[var(--ink-900)] sm:text-xl">
          {question.question}
        </p>
      </div>

      <div className="divide-y divide-[var(--line-muted)]">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = opt.isCorrect;
          const letter = OPTION_LETTERS[i] || String(i + 1);

          let rowStyle = 'text-[var(--ink-900)]';
          if (isSelected && !checked) {
            rowStyle = 'bg-[var(--brand-gold-100)]/70 text-[var(--ink-900)]';
          } else if (checked && isCorrect) {
            rowStyle = 'bg-emerald-50 text-emerald-950';
          } else if (checked && isSelected && !isCorrect) {
            rowStyle = 'bg-rose-50 text-rose-950';
          } else if (checked) {
            rowStyle = 'text-[var(--ink-500)]';
          }

          return (
            <button
              key={`${question.id}-${i}`}
              type="button"
              onClick={() => !checked && onSelect(i)}
              disabled={checked}
              className={`flex min-h-12 w-full cursor-pointer items-start gap-3 px-1 py-3 text-left disabled:cursor-default ${rowStyle}`}
            >
              <span className="mt-0.5 w-5 shrink-0 text-xs font-semibold">{letter}</span>
              <span className="flex-1 text-sm leading-relaxed font-medium sm:text-[15px]">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {checked && question.explanation ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-[var(--ink-500)] uppercase">Explanation</p>
          <p className="text-sm leading-relaxed text-[var(--ink-900)]">{question.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function SwepQuiz({
  base,
  isAuthenticated,
}: {
  base: '/swep' | '/dashboard/swep';
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const year = parseYearParam(searchParams.get('year'));
  const unit = parseUnitParam(searchParams.get('unit'), year);
  const random = searchParams.get('random') !== '0';
  const requestedCount = Number(searchParams.get('count') || 10);

  const activeQuiz = useMemo(() => getSwepQuiz(year), [year]);
  const yearLabel = year === '2018' ? 'SWEP 2018' : 'SWEP 2025/2026';

  const [questions] = useState(() => {
    let count = Number.isFinite(requestedCount) ? requestedCount : 10;
    if (!isAuthenticated) count = Math.min(count <= 0 ? GUEST_MAX_QUESTIONS : count, GUEST_MAX_QUESTIONS);
    return buildSession(unit, count, random, year);
  });

  const [phase, setPhase] = useState<Phase>('quiz');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<{ id: number; correct: boolean }[]>([]);
  const mainRef = useRef<HTMLElement>(null);

  const total = questions.length;
  const mcq = questions[currentQ];
  const isLast = currentQ === total - 1;

  const currentOptions = useMemo(() => {
    if (!mcq) return [];
    return shuffleOptions(mcq.formattedOptions || []);
  }, [mcq]);

  const close = () => router.push(`${base}/practice?year=${year}`);

  const handleAction = () => {
    if (!checked) {
      if (selectedOption === null) return;
      setChecked(true);
      const isCorrect = !!currentOptions[selectedOption]?.isCorrect;
      setAnswers((prev) => [...prev, { id: mcq.id, correct: isCorrect }]);

      if (mcq.explanation) {
        setTimeout(() => {
          mainRef.current?.scrollTo({ top: mainRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } else if (isLast) {
      setPhase('results');
    } else {
      setCurrentQ((q) => q + 1);
      setSelectedOption(null);
      setChecked(false);
      mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const retry = () => {
    setPhase('quiz');
    setCurrentQ(0);
    setSelectedOption(null);
    setChecked(false);
    setAnswers([]);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (total === 0) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-[var(--surface-page)] p-6">
        <p className="text-sm text-[var(--ink-500)]">No questions matched those filters.</p>
        <button
          type="button"
          onClick={close}
          className="cursor-pointer rounded-xl bg-[var(--brand-gold)] px-5 py-3 text-sm font-semibold text-[var(--ink-900)]"
        >
          Change filters
        </button>
      </div>
    );
  }

  if (phase === 'results') {
    const correctCount = answers.filter((a) => a.correct).length;
    const score = Math.round((correctCount / total) * 100);
    return (
      <div className="fixed inset-0 z-[80] flex w-full flex-col overflow-hidden bg-[var(--surface-page)] text-[var(--ink-900)]">
        <header className="shrink-0 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-xl items-center justify-between">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-ml-1.5 cursor-pointer rounded-full p-1.5 hover:bg-[var(--surface-sunken)]"
            >
              <X className="size-6" />
            </button>
            <span className="text-sm font-medium text-[var(--ink-500)]">Results</span>
            <div className="size-6" />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 touch-pan-y">
          <div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center gap-4 py-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
              <Check className="size-7 text-emerald-700" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-900)]">Session complete</h1>
            <p className="text-sm leading-relaxed text-[var(--ink-500)]">
              {score}% — {correctCount} of {total} correct
              <br />
              {unitLabel(unit, year)} · {yearLabel}
            </p>
            {!isAuthenticated ? (
              <p className="text-sm text-[var(--ink-500)]">
                <Link href="/auth/register" className="font-semibold text-[var(--ink-900)] underline-offset-2 hover:underline">
                  Sign up free
                </Link>{' '}
                to practice all {activeQuiz.totalQuestions} questions in this edition.
              </p>
            ) : null}
          </div>
        </main>

        <footer className="shrink-0 bg-[var(--surface-page)] px-4 py-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
            <button
              type="button"
              onClick={retry}
              className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] text-base font-semibold text-[var(--ink-900)]"
            >
              <RotateCcw className="size-4" /> Try again
            </button>
            <button
              type="button"
              onClick={close}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center text-sm font-medium text-[var(--ink-700)]"
            >
              Change filters
            </button>
            <Link href={base} className="block py-1 text-center text-sm font-medium text-[var(--ink-500)]">
              Back to hub
            </Link>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex w-full flex-col overflow-hidden bg-[var(--surface-page)] text-[var(--ink-900)]">
      <header className="shrink-0 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <button
            type="button"
            onClick={close}
            aria-label="Close quiz"
            className="-ml-1.5 cursor-pointer rounded-full p-1.5 hover:bg-[var(--surface-sunken)]"
          >
            <X className="size-6" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-medium text-[var(--ink-500)]">
              {currentQ + 1} of {total}
            </p>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-[var(--ink-900)]"
                style={{ width: `${((currentQ + 1) / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
        <div className="mx-auto w-full max-w-xl px-4 py-3 sm:px-6 sm:py-5 pb-8">
          <QuizQuestion
            key={mcq.id}
            question={mcq}
            options={currentOptions}
            selected={selectedOption}
            checked={checked}
            yearLabel={yearLabel}
            onSelect={(idx) => setSelectedOption(idx)}
          />
        </div>
      </main>

      <footer className="shrink-0 bg-[var(--surface-page)] px-4 py-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={handleAction}
            disabled={!checked && selectedOption === null}
            className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--brand-gold)] text-base font-semibold text-[var(--ink-900)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {!checked ? 'Check answer' : isLast ? 'Finish' : 'Continue'}
          </button>
        </div>
      </footer>
    </div>
  );
}
