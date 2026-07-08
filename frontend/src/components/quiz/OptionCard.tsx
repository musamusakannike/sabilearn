import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { formatMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/cn";

interface OptionCardProps {
  optionText: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  isCorrectAnswer: boolean;
  onSelect: (text: string) => void;
  disabled: boolean;
}

const letterMap = ["A", "B", "C", "D", "E", "F"];

export default function OptionCard({
  optionText,
  index,
  isSelected,
  isCorrect,
  showResult,
  isCorrectAnswer,
  onSelect,
  disabled,
}: OptionCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);

  // Staggered entry animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          x: -30,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          delay: index * 0.08,
          ease: "power2.out",
        }
      );
    }
  }, [index]);

  // Shake on incorrect click, pulse on correct click
  useEffect(() => {
    if (showResult && cardRef.current) {
      if (isSelected && !isCorrect) {
        gsap.to(cardRef.current, {
          keyframes: [
            { x: -10, duration: 0.08 },
            { x: 10, duration: 0.08 },
            { x: -10, duration: 0.08 },
            { x: 10, duration: 0.08 },
            { x: 0, duration: 0.08 },
          ],
          ease: "power2.out",
        });
      } else if (isCorrectAnswer) {
        gsap.to(cardRef.current, {
          keyframes: [
            { scale: 1.02, duration: 0.15 },
            { scale: 1, duration: 0.15 },
          ],
          ease: "power2.out",
        });
      }
    }
  }, [showResult, isSelected, isCorrect, isCorrectAnswer]);

  const handleClick = () => {
    if (!disabled) {
      gsap.to(cardRef.current, {
        scale: 0.98,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
      });
      onSelect(optionText);
    }
  };

  const getStyleClass = () => {
    if (showResult) {
      if (isCorrectAnswer) {
        return "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]";
      }
      if (isSelected && !isCorrect) {
        return "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]";
      }
      return "border-[var(--border)] bg-[var(--bg-secondary)] opacity-60";
    }

    if (isSelected) {
      return "border-[var(--accent)] bg-[var(--accent-muted)]";
    }
    return "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--bg-secondary)]";
  };

  return (
    <button
      ref={cardRef}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 select-none",
        getStyleClass(),
        showResult && !isSelected && !isCorrectAnswer && "cursor-default"
      )}
      style={{ opacity: 0 }}
    >
      <div className="flex items-center gap-3 flex-1">
        <span
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg font-semibold text-xs shrink-0 transition-colors",
            showResult
              ? isCorrectAnswer
                ? "bg-[var(--success)] text-[var(--bg-primary)]"
                : isSelected && !isCorrect
                  ? "bg-[var(--danger)] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
              : isSelected
                ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
          )}
        >
          {letterMap[index] || index + 1}
        </span>
        <span
          className="prose max-w-none [&_p]:m-0 [&_p]:inline text-[var(--text-primary)]"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(optionText) }}
        />
      </div>

      {showResult && isCorrectAnswer && (
        <svg className="w-5 h-5 text-[var(--success)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {showResult && isSelected && !isCorrect && (
        <svg className="w-5 h-5 text-[var(--danger)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
}
