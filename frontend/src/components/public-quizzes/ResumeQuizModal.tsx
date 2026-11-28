'use client';

import { Play, RotateCcw } from 'lucide-react';

interface ResumeQuizModalProps {
  topicTitle: string;
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  timestamp: number;
  onContinue: () => void;
  onStartFresh: () => void;
}

export default function ResumeQuizModal({
  topicTitle,
  currentQuestion,
  totalQuestions,
  answeredCount,
  timestamp,
  onContinue,
  onStartFresh,
}: ResumeQuizModalProps) {
  const savedAgo = (() => {
    const mins = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    return `${hrs}h ago`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E1A]/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-xl)]">
        <div className="mb-3 inline-flex rounded-full bg-[var(--brand-gold-100)] px-3 py-1 text-xs font-bold text-[var(--ink-900)]">
          Saved Progress Found · {savedAgo}
        </div>
        <h2 className="text-xl font-bold text-[var(--ink-900)]">Resume {topicTitle}?</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-700)]">
          You stopped on question <strong>{currentQuestion}</strong> of <strong>{totalQuestions}</strong>{' '}
          ({answeredCount} answered). Pick up where you left off or start a fresh attempt.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onContinue}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--brand-gold)] px-4 py-3 text-sm font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--brand-gold-600)]"
          >
            <Play className="h-4 w-4" /> Continue Quiz
          </button>
          <button
            type="button"
            onClick={onStartFresh}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--surface-sunken)]"
          >
            <RotateCcw className="h-4 w-4" /> Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
