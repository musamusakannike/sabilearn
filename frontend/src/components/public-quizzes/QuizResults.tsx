'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  Layers,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { RecommendedCourse } from '@/types/public-quiz';

interface QuizResultsProps {
  courseCode: string;
  score: number;
  total: number;
  wrongCount: number;
  skippedCount: number;
  topicTitle: string;
  confettiThreshold?: number;
  recommendedCourse?: RecommendedCourse;
  basePath: string;
  onRestart: () => void;
  onReview: () => void;
}

export default function QuizResults({
  courseCode,
  score,
  total,
  wrongCount,
  skippedCount,
  topicTitle,
  confettiThreshold = 65,
  recommendedCourse,
  basePath,
  onRestart,
  onReview,
}: QuizResultsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScore, setDisplayScore] = useState(0);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passedConfettiThreshold = percentage >= confettiThreshold;

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 24, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' }
      );
    }

    const durationMs = 1100;
    const startTime = Date.now();
    let frameId = 0;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (passedConfettiThreshold) {
      const confettiDuration = 2800;
      const animationEnd = Date.now() + confettiDuration;
      const brandColors = ['#F8BE43', '#5B4FE8', '#10B981', '#F97316', '#0E0E1A'];

      intervalId = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          if (intervalId) clearInterval(intervalId);
          return;
        }
        const particleCount = Math.max(12, Math.round(45 * (timeLeft / confettiDuration)));
        confetti({
          startVelocity: 28,
          spread: 360,
          ticks: 60,
          zIndex: 60,
          particleCount,
          origin: { x: 0.15 + Math.random() * 0.2, y: Math.random() * 0.3 },
          colors: brandColors,
        });
        confetti({
          startVelocity: 28,
          spread: 360,
          ticks: 60,
          zIndex: 60,
          particleCount,
          origin: { x: 0.65 + Math.random() * 0.2, y: Math.random() * 0.3 },
          colors: brandColors,
        });
      }, 260);
    }

    return () => {
      cancelAnimationFrame(frameId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [score, passedConfettiThreshold]);

  const feedbackMessage = (() => {
    if (percentage === 100) return `Flawless! You mastered ${courseCode}.`;
    if (percentage >= 80) return 'Excellent work! You are exam-ready.';
    if (percentage >= confettiThreshold) return 'Solid pass! Keep sharpening those calculations.';
    if (percentage >= 45) return 'Getting there — review the explanations and try again.';
    return 'Keep practicing! Use Review Answers to study the worked steps.';
  })();

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      {/* Main Score Card */}
      <div className="rounded-3xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] p-6 shadow-[0_6px_0_#0E0E1A] sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--ink-900)] ${
              passedConfettiThreshold
                ? 'bg-[var(--brand-gold)] text-[var(--ink-900)]'
                : 'bg-[var(--surface-sunken)] text-[var(--ink-700)]'
            }`}
          >
            <Trophy className="h-7 w-7" />
          </div>

          <span className="rounded-full bg-[var(--brand-gold-100)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--ink-900)]">
            {courseCode} Quiz Complete
          </span>
          <h1 className="mt-2.5 text-2xl font-bold text-[var(--ink-900)] sm:text-3xl">
            {topicTitle}
          </h1>

          {/* Score Ring */}
          <div
            className={`mt-6 flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 ${
              passedConfettiThreshold
                ? 'border-[#10B981] bg-emerald-50'
                : 'border-[var(--brand-gold)] bg-[var(--brand-gold-100)]/30'
            }`}
          >
            <div className="text-4xl font-extrabold text-[var(--ink-900)]">{percentage}%</div>
            <div className="text-sm font-semibold text-[var(--ink-500)]">
              {displayScore} / {total}
            </div>
          </div>

          <p className="mt-4 max-w-md text-base font-semibold text-[var(--ink-700)]">
            {feedbackMessage}
          </p>

          {/* Breakdown Stats */}
          <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-3">
            <div className="rounded-xl border border-[var(--line)] bg-emerald-50/70 p-3">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Correct
              </div>
              <div className="mt-1 text-xl font-extrabold text-emerald-900">{score}</div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-red-50/70 p-3">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-red-700">
                <XCircle className="h-3.5 w-3.5" /> Wrong
              </div>
              <div className="mt-1 text-xl font-extrabold text-red-900">{wrongCount}</div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-amber-50/70 p-3">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-700">
                <SkipForward className="h-3.5 w-3.5" /> Skipped
              </div>
              <div className="mt-1 text-xl font-extrabold text-amber-900">{skippedCount}</div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--brand-gold)] px-5 py-3 text-sm font-bold text-[var(--ink-900)] shadow-[0_3px_0_#0E0E1A] transition-all hover:bg-[var(--brand-gold-600)]"
            >
              <RotateCcw className="h-4 w-4" /> Retake Quiz
            </button>
            <button
              type="button"
              onClick={onReview}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-white px-5 py-3 text-sm font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <Eye className="h-4 w-4" /> Review Answers
            </button>
            <Link
              href={basePath}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--surface-sunken)] px-5 py-3 text-sm font-bold text-[var(--ink-900)] no-underline transition-colors hover:bg-[var(--line)]"
            >
              <BookOpen className="h-4 w-4" /> All {courseCode} Topics
            </Link>
          </div>
        </div>
      </div>

      {/* Optional Recommended Course Card */}
      {recommendedCourse && (
        <div className="mt-7 overflow-hidden rounded-3xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] shadow-[0_6px_0_#5B4FE8]">
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--brand-violet-100)] px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-violet)]">
              <Sparkles className="h-4 w-4" />
              Recommended Course on SabiLearn
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {recommendedCourse.isFree
                ? 'Free Course'
                : `₦${(recommendedCourse.price / 100).toLocaleString()}`}
            </span>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-[180px_1fr] sm:items-center">
            {recommendedCourse.banner ? (
              <Link
                href={`/courses/${recommendedCourse.slug}`}
                className="block overflow-hidden rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--surface-sunken)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={recommendedCourse.banner}
                  alt={recommendedCourse.title}
                  className="h-36 w-full object-cover transition-transform duration-300 hover:scale-105 sm:h-32"
                />
              </Link>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--brand-violet)] text-white">
                <GraduationCap className="h-12 w-12" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--ink-500)]">
                <span className="rounded-full bg-[var(--surface-sunken)] px-2.5 py-0.5 text-[var(--ink-700)]">
                  {recommendedCourse.category}
                </span>
                {recommendedCourse.difficulty && (
                  <span className="capitalize">{recommendedCourse.difficulty}</span>
                )}
                {typeof recommendedCourse.chaptersCount === 'number' &&
                  recommendedCourse.chaptersCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {recommendedCourse.chaptersCount} Chapters
                    </span>
                  )}
              </div>

              <h2 className="mt-2 text-lg font-bold leading-snug text-[var(--ink-900)] sm:text-xl">
                {recommendedCourse.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-700)]">
                {recommendedCourse.description}
              </p>

              <div className="mt-4">
                <Link
                  href={`/courses/${recommendedCourse.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--brand-violet)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_#0E0E1A] no-underline transition-all hover:bg-[var(--brand-violet-600)]"
                >
                  Explore Course Details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
