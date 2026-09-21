'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { TopicQuiz } from '@/lib/types';
import { RichText } from '@/components/lesson/RichText';

function shuffleOptions<T>(options: T[]): T[] {
  if (!options || options.length === 0) return [];
  const array = [...options];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function QuizStep({ quiz, onAnswered }: { quiz: TopicQuiz; onAnswered: (correct: boolean) => void }) {
  const [shuffledOptions] = useState(() => shuffleOptions(quiz.options));
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    if (selected === null) return;
    setChecked(true);
    onAnswered(!!shuffledOptions[selected]?.isCorrect);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <HelpCircle className="size-3.5" />
          <span>Quick Quiz</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold leading-snug text-[var(--ink-900)]">
          <RichText text={quiz.question} />
        </p>
      </div>

      <div className="space-y-3">
        {shuffledOptions.map((opt, i) => {
          const isSelected = selected === i;
          const showState = checked && (isSelected || opt.isCorrect);

          let containerStyle = 'border-[var(--line)] bg-[var(--surface-card)] hover:border-slate-400 dark:hover:border-slate-500';
          if (isSelected && !checked) {
            containerStyle = 'border-2 border-sky-500 bg-sky-50/50 dark:bg-sky-950/30';
          } else if (showState && opt.isCorrect) {
            containerStyle = 'border-2 border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100';
          } else if (showState && isSelected && !opt.isCorrect) {
            containerStyle = 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100';
          }

          return (
            <button
              key={i}
              onClick={() => !checked && setSelected(i)}
              disabled={checked}
              className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all cursor-pointer ${containerStyle}`}
            >
              <span className="text-base font-semibold text-[var(--ink-900)] flex-1"><RichText text={opt.text} /></span>
              {showState && opt.isCorrect && <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
              {showState && isSelected && !opt.isCorrect && <XCircle className="size-5 shrink-0 text-rose-600 dark:text-rose-400" />}
            </button>
          );
        })}
      </div>

      {!checked ? (
        <button
          onClick={handleCheck}
          disabled={selected === null}
          className="w-full sm:w-auto cursor-pointer rounded-2xl bg-[#FF8A00] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#F07D00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check Answer
        </button>
      ) : (
        quiz.explanation && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-4 sm:p-5 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Explanation</span>
            <p className="text-sm sm:text-base leading-relaxed text-[var(--ink-900)]"><RichText text={quiz.explanation} /></p>
          </div>
        )
      )}
    </div>
  );
}
