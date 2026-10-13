'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, CheckCircle2, HelpCircle, RotateCcw, X, XCircle } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            <HelpCircle className="size-3.5" />
            <span>{yearLabel}</span>
          </div>
          <span className="rounded-full bg-[var(--surface-sunken)] px-3 py-1 text-xs font-bold text-[var(--text-muted)]">
            Q{question.questionNumber}
          </span>
        </div>
        <p className="text-xs font-bold tracking-wider text-[var(--brand-gold-600)] uppercase">
          {question.unitName}
        </p>
        <p className="text-xl leading-snug font-bold text-[var(--ink-900)] sm:text-2xl">
          {question.question}
        </p>
      </div>

      <div className="space-y-3">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = opt.isCorrect;
          const letter = OPTION_LETTERS[i] || String(i + 1);

          let containerStyle = 'border-[var(--line)] bg-[var(--surface-card)] hover:border-slate-400';
          let badgeStyle = 'bg-[var(--surface-sunken)] text-[var(--text-muted)]';

          if (isSelected && !checked) {
            containerStyle = 'border-2 border-sky-500 bg-sky-50/70 shadow-sm';
            badgeStyle = 'bg-sky-500 text-white';
          } else if (checked && isCorrect) {
            containerStyle = 'border-2 border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-sm';
            badgeStyle = 'bg-emerald-500 text-white';
          } else if (checked && isSelected && !isCorrect) {
            containerStyle = 'border-2 border-rose-500 bg-rose-50/80 text-rose-950 shadow-sm';
            badgeStyle = 'bg-rose-500 text-white';
          } else if (checked) {
            containerStyle = 'border-[var(--line)] bg-[var(--surface-card)] opacity-50';
          }

          return (
            <button
              key={`${question.id}-${i}`}
              type="button"
              onClick={() => !checked && onSelect(i)}
              disabled={checked}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.99] sm:gap-4 sm:p-5 ${containerStyle}`}
            >
              <div className="flex flex-1 items-center gap-3">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${badgeStyle}`}
                >
                  {letter}
                </span>
                <span className="text-sm font-semibold text-[var(--ink-900)] sm:text-base">{opt.text}</span>
              </div>
              {checked && isCorrect && <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />}
              {checked && isSelected && !isCorrect && <XCircle className="size-5 shrink-0 text-rose-600" />}
            </button>
          );
        })}
      </div>

      {checked && question.explanation && (
        <div className="space-y-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-5">
          <span className="text-xs font-bold tracking-wider text-[var(--brand-gold-600)] uppercase">Explanation</span>
          <p className="text-sm leading-relaxed text-[var(--ink-900)] sm:text-base">{question.explanation}</p>
        </div>
      )}
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
  const usePills = total <= 20;

  // Memoize shuffled options for the current question
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

      // Smooth scroll to explanation if available
      if (mcq.explanation) {
        setTimeout(() => {
          mainRef.current?.scrollTo({ top: mainRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } else {
      if (isLast) {
        setPhase('results');
      } else {
        setCurrentQ((q) => q + 1);
        setSelectedOption(null);
        setChecked(false);
        mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      }
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
        <p className="font-medium text-[var(--text-muted)]">No questions matched those filters.</p>
        <button
          type="button"
          onClick={close}
          className="cursor-pointer rounded-2xl bg-[#FF8A00] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#F07D00]"
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
        <header className="shrink-0 border-b border-[var(--line)]/50 bg-[var(--surface-page)] p-4 sm:px-6">
          <div className="mx-auto flex max-w-xl items-center justify-between">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-ml-1.5 cursor-pointer rounded-full p-1.5 transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <X className="size-6 stroke-[2.5]" />
            </button>
            <span className="text-sm font-bold text-[var(--text-muted)]">{yearLabel} Results</span>
            <div className="size-6" />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 touch-pan-y">
          <div className="my-auto mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center gap-6 py-6 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100">
              <Check className="size-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-[var(--ink-900)]">Session complete!</h1>
              <p className="text-base leading-relaxed text-[var(--text-muted)]">
                You scored <span className="font-semibold text-[var(--ink-900)]">{score}%</span> — {correctCount} of {total}{' '}
                correct · {unitLabel(unit, year)} ({yearLabel})
              </p>
            </div>
            {!isAuthenticated && (
              <p className="text-sm text-[var(--text-muted)]">
                Create a free account to practice all {activeQuiz.totalQuestions} questions in this edition.{' '}
                <Link href="/auth/register" className="font-semibold text-[#FF8A00] hover:underline">
                  Sign up free
                </Link>
              </p>
            )}
          </div>
        </main>

        <footer className="shrink-0 border-t border-[var(--line)]/50 bg-[var(--surface-page)] p-4 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-xl space-y-2.5">
            <button
              type="button"
              onClick={retry}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#FF8A00] px-8 py-3.5 text-base font-bold tracking-wide text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-[#F07D00] active:scale-[0.98]"
            >
              <RotateCcw className="size-5" /> Try again
            </button>
            <button
              type="button"
              onClick={close}
              className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] px-8 py-3 text-sm font-bold text-[var(--ink-900)] hover:bg-[var(--surface-sunken)]"
            >
              Change filters & units
            </button>
            <Link
              href={base}
              className="block pt-1 text-center text-xs font-semibold text-[#FF8A00] hover:underline"
            >
              Back to SWEP Hub
            </Link>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex w-full flex-col overflow-hidden bg-[var(--surface-page)] text-[var(--ink-900)]">
      <header className="shrink-0 border-b border-[var(--line)]/50 bg-[var(--surface-page)] p-4 sm:px-6">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={close}
            aria-label="Close quiz"
            className="-ml-1.5 cursor-pointer rounded-full p-1.5 transition-colors hover:bg-[var(--surface-sunken)]"
          >
            <X className="size-6 stroke-[2.5]" />
          </button>

          {usePills ? (
            <div className="mx-2 flex max-w-xs flex-1 items-center gap-1.5 sm:max-w-sm">
              {questions.map((_, i) => {
                const isActive = i === currentQ;
                const isCompleted = i < currentQ;
                return (
                  <div
                    key={i}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isActive ? 'flex-[2.5] bg-[#22C55E]' : isCompleted ? 'flex-1 bg-[#22C55E]' : 'flex-1 bg-slate-200'
                    }`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mx-2 flex-1">
              <div className="mb-1 flex justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                <span>
                  Question {currentQ + 1} of {total}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#22C55E] transition-all duration-300"
                  style={{ width: `${((currentQ + 1) / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <span className="min-w-[3ch] pl-1 text-right text-sm font-extrabold text-[var(--ink-900)]">
            {currentQ + 1}/{total}
          </span>
        </div>
      </header>

      <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
        <div className="mx-auto w-full max-w-xl p-4 sm:p-6 pb-12 sm:pb-16">
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

      <footer className="shrink-0 border-t border-[var(--line)]/50 bg-[var(--surface-page)]/95 backdrop-blur-xs p-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <button
            type="button"
            onClick={handleAction}
            disabled={!checked && selectedOption === null}
            className="flex flex-1 cursor-pointer items-center justify-center rounded-2xl bg-[#FF8A00] px-8 py-3.5 text-base font-bold tracking-wide text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#F07D00] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:py-4 sm:text-lg"
          >
            <span>{!checked ? 'Check Answer' : isLast ? 'Finish' : 'Continue'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
