"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  X,
  MoreHorizontal,
  PartyPopper,
  ChevronLeft,
  Flag,
  Check,
  ChevronDown,
} from "lucide-react";
import { Topic } from "@/lib/types";
import { useProgressStore } from "@/store/progress.store";
import { progressApi } from "@/lib/api";
import InfoStepBlock from "./InfoStepBlock";
import QuizStep from "./QuizStep";
import ExerciseRunner from "./ExerciseRunner";
import InLessonAiTutor from "./InLessonAiTutor";

export default function StepPlayer({
  topic,
  onClose,
}: {
  topic: Topic;
  onClose: () => void;
}) {
  const steps = topic.contents || [];
  const [index, setIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { saveContentPosition, fetchTopicProgress } = useProgressStore();
  const total = steps.length;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Resume where the learner last left off
  useEffect(() => {
    let cancelled = false;
    fetchTopicProgress(topic._id).then((progress) => {
      if (
        !cancelled &&
        progress &&
        progress.lastContentIndex > 0 &&
        progress.lastContentIndex < total
      ) {
        setIndex(progress.lastContentIndex);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic._id]);

  // Persist the learner's position
  useEffect(() => {
    if (finished) return;
    saveContentPosition({
      course: topic.course,
      topic: topic._id,
      contentIndex: index,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, topic._id, finished]);

  const triggerConfettiFall = useCallback(() => {
    // Initial center burst
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
      colors: [
        "#FF8A00",
        "#22C55E",
        "#3B82F6",
        "#EC4899",
        "#EAB308",
        "#8B5CF6",
      ],
    });

    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 80,
      zIndex: 1000,
      colors: [
        "#FF8A00",
        "#22C55E",
        "#3B82F6",
        "#EC4899",
        "#EAB308",
        "#8B5CF6",
      ],
    };

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 35 * (timeLeft / duration);

      // Cascading shower from top-left and top-right
      confetti({
        ...defaults,
        particleCount,
        angle: 60,
        spread: 65,
        origin: { x: 0.05, y: 0.65 },
      });
      confetti({
        ...defaults,
        particleCount,
        angle: 120,
        spread: 65,
        origin: { x: 0.95, y: 0.65 },
      });
    }, 220);

    return () => clearInterval(interval);
  }, []);

  // Trigger confetti celebration on lesson completion
  useEffect(() => {
    if (!finished) return;
    const cleanup = triggerConfettiFall();
    return () => {
      if (cleanup) cleanup();
    };
  }, [finished, triggerConfettiFall]);

  const step = steps[index];
  const isLastStep = index === total - 1;
  const isQuizStep = step?.type === "quiz";
  const canAdvance = !isQuizStep || quizAnswered;

  const markTopicComplete = async () => {
    if (hasCompleted) return;
    try {
      setIsSubmittingCompletion(true);
      await progressApi.completeTopic({
        courseId: topic.course,
        topicId: topic._id,
      });
      setHasCompleted(true);
    } catch (e) {
      console.error("Failed to complete topic on server:", e);
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      setFinished(true);
      await markTopicComplete();
      return;
    }
    setQuizAnswered(false);
    setIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (index > 0) {
      setQuizAnswered(true);
      setIndex((i) => i - 1);
    }
  };

  if (total === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-[var(--surface-page)] p-6">
        <p className="text-[var(--text-muted)] text-base font-medium">
          This topic has no lesson steps yet.
        </p>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-2xl bg-[#FF8A00] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#F07D00] transition-colors"
        >
          Go back to course
        </button>
      </div>
    );
  }

  // Celebration Finished Screen
  if (finished) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--surface-page)] text-[var(--ink-900)]">
        {/* Top bar with close button */}
        <div className="flex items-center justify-between px-6 py-5 max-w-xl mx-auto w-full">
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer p-2 rounded-full hover:bg-[var(--surface-sunken)] transition-colors text-[var(--ink-900)]"
          >
            <X className="size-6" />
          </button>
          <div className="flex items-center gap-1.5 font-bold">
            <svg
              className="size-6 fill-rose-500 text-rose-500"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-base font-extrabold text-[var(--ink-900)]">
              5
            </span>
          </div>
        </div>

        {/* Celebration Body */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center max-w-md mx-auto animate-in fade-in zoom-in-95 duration-300">
          <div
            className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={triggerConfettiFall}
            title="Click for more confetti!"
          >
            <div className="flex size-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 shadow-lg ring-8 ring-emerald-50/50 dark:ring-emerald-900/20">
              <PartyPopper className="size-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white shadow-md">
              +{topic.xp || 50} XP
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black text-[var(--ink-900)] tracking-tight">
              Lesson Complete!
            </h1>
            <p className="text-base text-[var(--text-muted)] leading-relaxed">
              You&apos;ve successfully finished{" "}
              <span className="font-semibold text-[var(--ink-900)]">
                &ldquo;{topic.title}&rdquo;
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-sm font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check className="size-4 text-emerald-600" />
            <span>Progress saved & topic marked complete</span>
          </div>
        </div>

        {/* Bottom Continue Button */}
        <div className="w-full max-w-xl mx-auto p-6 pb-8">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center py-4 px-8 rounded-2xl bg-[#FF8A00] hover:bg-[#F07D00] active:scale-[0.98] text-white text-lg font-bold tracking-wide shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const isTakeaway =
    step?.title?.trim().toLowerCase() === "takeaway" ||
    (step?.type === "text" &&
      step.content.length < 120 &&
      isLastStep &&
      !step.title);

  const displayTitle = step?.title || topic.title;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--surface-page)] text-[var(--ink-900)]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 bg-[var(--surface-page)]/95 backdrop-blur-xs px-4 sm:px-6 py-4 border-b border-[var(--line)]/50">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Close 'X' button */}
          <button
            onClick={onClose}
            aria-label="Close lesson"
            className="cursor-pointer p-1.5 -ml-1.5 rounded-full hover:bg-[var(--surface-sunken)] transition-colors text-[var(--ink-900)]"
          >
            <X className="size-6 stroke-[2.5]" />
          </button>

          {/* Segmented Pill Progress Bar */}
          <div className="flex items-center gap-1.5 flex-1 max-w-xs sm:max-w-sm mx-2">
            {steps.map((_, i) => {
              const isActive = i === index;
              const isCompleted = i < index;
              return (
                <div
                  key={i}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? "flex-[2.5] bg-[#22C55E]"
                      : isCompleted
                        ? "flex-1 bg-[#22C55E]"
                        : "flex-1 bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              );
            })}
          </div>

          {/* Hearts / Lives Counter */}
          <div className="flex items-center gap-1.5 font-bold select-none pl-1">
            <ChevronDown className="text-[var(--ink-900)]" size={32} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-6 sm:py-8 flex flex-col justify-start">
        {/* Step Title Row with 3-dots Menu */}
        <div className="relative mb-6 flex items-start justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink-900)]">
            {displayTitle}
          </h1>

          {/* More Options '...' button */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More options"
              className="cursor-pointer p-1.5 rounded-full text-[var(--ink-900)] hover:bg-[var(--surface-sunken)] transition-colors"
            >
              <MoreHorizontal className="size-6 stroke-[2.5]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    alert("Feedback submitted. Thank you!");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--ink-900)] hover:bg-[var(--surface-sunken)] transition-colors text-left"
                >
                  <Flag className="size-4 text-[var(--text-muted)]" />
                  <span>Report an issue</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        {isTakeaway ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 sm:py-20 text-center">
            <p className="text-xl sm:text-2xl font-bold leading-relaxed text-[var(--ink-900)] max-w-md">
              {step.content}
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-6">
            {step.type === "quiz" && step.quiz ? (
              <QuizStep
                key={step._id || `step-${index}`}
                quiz={step.quiz}
                onAnswered={() => setQuizAnswered(true)}
              />
            ) : step.type === "exercise" && step.exercise ? (
              <ExerciseRunner
                key={step._id || `step-${index}`}
                exercise={step.exercise}
              />
            ) : (
              <InfoStepBlock
                key={step._id || `step-${index}`}
                content={step}
                index={index}
                topicTitle={topic.title}
              />
            )}
          </div>
        )}
      </main>

      {/* Fixed / Sticky Bottom Action Bar */}
      <footer className="sticky bottom-0 z-20 bg-[var(--surface-page)]/95 backdrop-blur-xs border-t border-[var(--line)]/50 px-6 py-4 pb-6 sm:pb-6">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {index > 0 && (
            <button
              onClick={handlePrev}
              aria-label="Previous step"
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-900)] shadow-xs transition-all hover:bg-[var(--surface-sunken)] active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="size-6 stroke-[2.5]" />
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canAdvance || isSubmittingCompletion}
            className="flex-1 flex items-center justify-center py-4 px-8 rounded-2xl bg-[#FF8A00] hover:bg-[#F07D00] active:scale-[0.98] text-white text-lg font-bold tracking-wide shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <span>{isLastStep ? "Finish" : "Continue"}</span>
          </button>
        </div>
      </footer>

      {/* Floating In-Lesson Contextual AI Tutor */}
      {step && (
        <InLessonAiTutor
          topicTitle={topic.title}
          stepTitle={displayTitle}
          stepContent={
            step.type === "quiz" && step.quiz
              ? `Quiz Question: ${step.quiz.question}\nOptions: ${step.quiz.options?.map((o, i) => `${i + 1}. ${o.text}`).join(", ") || ""}\nExplanation: ${step.quiz.explanation || ""}`
              : step.type === "exercise" && step.exercise
                ? `Exercise: ${step.exercise.instructions || ""}\nStarter Code:\n${step.exercise.starterCode || ""}`
                : step.type === "group" && step.blocks
                  ? step.blocks.map((b) => b.content || "").join("\n\n")
                  : step.content || topic.description || ""
          }
        />
      )}
    </div>
  );
}
