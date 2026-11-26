import { useEffect, useMemo, useState } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Button, Card, Kbd } from '@/components/ui';
import { TopicQuiz } from '@/lib/types';
import { RichMathText } from './RichContent';

export interface QuizStepProps {
  quiz: TopicQuiz;
  onAnswered: (isCorrect: boolean) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuizStep({ quiz, onAnswered }: QuizStepProps) {
  const options = useMemo(() => [...(quiz.options || [])], [quiz]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    if (selectedIdx === null || checked) return;
    setChecked(true);
    onAnswered(!!options[selectedIdx]?.isCorrect);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (!checked) {
        const num = Number(e.key);
        if (num >= 1 && num <= options.length) {
          e.preventDefault();
          setSelectedIdx(num - 1);
          return;
        }
        const upper = e.key.toUpperCase();
        const letterIdx = LETTERS.indexOf(upper);
        if (letterIdx >= 0 && letterIdx < options.length) {
          e.preventDefault();
          setSelectedIdx(letterIdx);
          return;
        }
        if (e.key === 'Enter' && selectedIdx !== null) {
          e.preventDefault();
          handleCheck();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, selectedIdx, options]);

  const isCorrect = selectedIdx !== null && !!options[selectedIdx]?.isCorrect;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--brand-ai)]">
          Quick Check
        </span>
        <span className="text-[11.5px] text-[var(--text-tertiary)] hidden sm:inline-flex items-center gap-1">
          Press <Kbd>1–{options.length}</Kbd> to pick, <Kbd>Enter</Kbd> to check
        </span>
      </div>

      <div className="text-[16px] font-semibold text-[var(--text-primary)] leading-snug">
        <RichMathText text={quiz.question} />
      </div>

      <div className="space-y-2" role="radiogroup" aria-label="Quiz options">
        {options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          let cls =
            'border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-sunken)]/60';
          if (checked) {
            if (opt.isCorrect) {
              cls = 'border-[var(--success)] bg-[var(--success-bg)]/60';
            } else if (isSelected && !opt.isCorrect) {
              cls = 'border-[var(--danger)] bg-[var(--danger-bg)]/60';
            }
          } else if (isSelected) {
            cls = 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/50';
          }

          return (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={checked}
              onClick={() => setSelectedIdx(idx)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border text-left transition-all cursor-pointer disabled:cursor-default ${cls}`}
            >
              <span className="w-7 h-7 rounded-full border border-[var(--border-strong)] bg-[var(--surface-card)] text-[12px] font-bold flex items-center justify-center shrink-0">
                {LETTERS[idx] || idx + 1}
              </span>
              <span className="flex-1 text-[14.5px] text-[var(--text-primary)]">
                <RichMathText text={opt.text} />
              </span>
              {checked && opt.isCorrect && (
                <IconCheck size={18} className="text-[var(--success)] shrink-0" />
              )}
              {checked && isSelected && !opt.isCorrect && (
                <IconX size={18} className="text-[var(--danger)] shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {!checked ? (
        <div className="pt-1">
          <Button disabled={selectedIdx === null} onClick={handleCheck}>
            Check Answer
          </Button>
        </div>
      ) : (
        <div
          role="status"
          className={`p-3.5 rounded-[var(--radius-md)] text-[13.5px] ${
            isCorrect
              ? 'bg-[var(--success-bg)] text-[var(--success)]'
              : 'bg-[var(--danger-bg)] text-[var(--danger)]'
          }`}
        >
          <div className="font-bold">{isCorrect ? 'Correct!' : 'Not quite right'}</div>
          {quiz.explanation && (
            <div className="mt-1 text-[var(--text-primary)]">
              <RichMathText text={quiz.explanation} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
