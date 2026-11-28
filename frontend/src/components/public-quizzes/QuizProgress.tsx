'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface QuizProgressProps {
  current: number;
  total: number;
  score: number;
  answeredCount: number;
}

export default function QuizProgress({
  current,
  total,
  score,
  answeredCount,
}: QuizProgressProps) {
  const fillRef = useRef<HTMLDivElement>(null);
  const percentage = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  useEffect(() => {
    if (fillRef.current) {
      gsap.to(fillRef.current, {
        width: `${percentage}%`,
        duration: 0.45,
        ease: 'power2.out',
      });
    }
  }, [percentage]);

  return (
    <div className="mb-6 rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-bold text-[var(--ink-900)]">
          Question {current} <span className="font-medium text-[var(--ink-500)]">of {total}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--surface-sunken)] px-3 py-0.5 text-xs font-semibold text-[var(--ink-700)]">
            Answered: {answeredCount}/{total}
          </span>
          <span className="rounded-full bg-[var(--brand-gold-100)] px-3 py-0.5 text-xs font-bold text-[var(--ink-900)]">
            Score: {score}
          </span>
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
        <div
          ref={fillRef}
          className="h-full rounded-full bg-[var(--brand-gold)] transition-colors"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
