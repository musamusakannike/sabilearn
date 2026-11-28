'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Check, X } from 'lucide-react';
import { PublicQuizOption } from '@/types/public-quiz';
import { RichText } from '@/components/lesson/RichText';

interface OptionCardProps {
  option: PublicQuizOption;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  correctAnswerId: string;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function OptionCard({
  option,
  index,
  isSelected,
  isCorrect,
  showResult,
  correctAnswerId,
  onSelect,
  disabled,
}: OptionCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const isThisCorrect = option.id === correctAnswerId;

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, x: -16 },
        {
          opacity: 1,
          x: 0,
          duration: 0.32,
          delay: index * 0.05,
          ease: 'power2.out',
        }
      );
    }
  }, [index, option.id]);

  useEffect(() => {
    if (!showResult || !cardRef.current) return;
    if (isSelected && !isCorrect) {
      gsap.to(cardRef.current, {
        keyframes: [
          { x: -8, duration: 0.06 },
          { x: 8, duration: 0.06 },
          { x: -6, duration: 0.06 },
          { x: 6, duration: 0.06 },
          { x: 0, duration: 0.06 },
        ],
        ease: 'power2.out',
      });
    } else if (isThisCorrect) {
      gsap.to(cardRef.current, {
        keyframes: [
          { scale: 1.015, duration: 0.14 },
          { scale: 1, duration: 0.14 },
        ],
        ease: 'power2.out',
      });
    }
  }, [showResult, isSelected, isCorrect, isThisCorrect]);

  const handleClick = () => {
    if (disabled) return;
    onSelect(option.id);
  };

  let containerClasses =
    'border-[var(--line)] bg-[var(--surface-card)] hover:border-[var(--ink-900)] hover:bg-[var(--brand-gold-100)]/25';
  let badgeClasses = 'border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--ink-900)]';

  if (showResult) {
    if (isThisCorrect) {
      containerClasses = 'border-[#10B981] bg-emerald-50/90 ring-1 ring-[#10B981]';
      badgeClasses = 'border-[#10B981] bg-[#10B981] text-white';
    } else if (isSelected && !isCorrect) {
      containerClasses = 'border-[#E5484D] bg-red-50/90 ring-1 ring-[#E5484D]';
      badgeClasses = 'border-[#E5484D] bg-[#E5484D] text-white';
    } else {
      containerClasses = 'border-[var(--line)] bg-[var(--surface-card)] opacity-60';
    }
  }

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`group flex w-full flex-col rounded-xl border-2 p-4 text-left transition-all duration-150 ${containerClasses} ${
        disabled ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
      }`}
    >
      <div className="flex w-full items-start gap-3.5">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-colors ${badgeClasses}`}
        >
          {LETTERS[index] ?? index + 1}
        </span>

        <div className="min-w-0 flex-1 pt-0.5 text-[15px] font-medium leading-relaxed text-[var(--ink-900)]">
          <RichText text={option.text} />
        </div>

        {showResult && isThisCorrect && (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
            <Check className="h-4 w-4 stroke-[3]" />
          </span>
        )}

        {showResult && isSelected && !isCorrect && (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E5484D] text-white">
            <X className="h-4 w-4 stroke-[3]" />
          </span>
        )}
      </div>

      {showResult && isSelected && !isCorrect && option.whyWrong && (
        <div className="mt-3 ml-11 rounded-lg border border-red-200 bg-white/80 px-3 py-2 text-xs leading-relaxed text-red-700">
          <RichText text={option.whyWrong} />
        </div>
      )}
    </button>
  );
}
