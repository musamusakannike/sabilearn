"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  X,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Exercise, Question } from "@/lib/types";
import { RichText } from "@/components/lesson/RichText";
import { progressApi } from "@/lib/api";

interface AssessmentStepPlayerProps {
  exercise: Exercise;
  courseId: string;
  chapterId: string;
  chapterTitle?: string;
  onClose: () => void;
}

interface ShuffledQuestion extends Question {
  shuffledOptions?: string[];
}

// Utility: Fisher-Yates shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function AssessmentStepPlayer({
  exercise,
  courseId,
  chapterId,
  chapterTitle,
  onClose,
}: AssessmentStepPlayerProps) {
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [resultScore, setResultScore] = useState<number>(0);
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [alreadyRewarded, setAlreadyRewarded] = useState<boolean>(false);
  const startedAt = useRef<number>(Date.now());

  // Initialize and randomly reorder MCQ options on mount / reset
  const initQuestions = useCallback(() => {
    if (!exercise?.questions) return;
    const randomized = exercise.questions.map((q) => {
      if (q.type === "mcq" && q.options && q.options.length > 0) {
        return {
          ...q,
          shuffledOptions: shuffleArray(q.options),
        };
      }
      return { ...q };
    });
    setQuestions(randomized);
    setCurrentIndex(0);
    setUserAnswers({});
    setCheckedSteps({});
    setFinished(false);
    startedAt.current = Date.now();
  }, [exercise]);

  useEffect(() => {
    initQuestions();
  }, [initQuestions]);

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 80,
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
  }, []);

  const total = questions.length;
  const currentQ = questions[currentIndex];
  const isCurrentChecked = !!checkedSteps[currentIndex];
  const currentUserAns = userAnswers[currentIndex] || "";

  const isCurrentCorrect = currentQ
    ? currentUserAns.trim().toLowerCase() ===
      currentQ.correctAnswer.trim().toLowerCase()
    : false;

  const handleSelectOption = (option: string) => {
    if (isCurrentChecked) return;
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const handleTextChange = (val: string) => {
    if (isCurrentChecked) return;
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: val }));
  };

  const handleCheckAnswer = () => {
    if (!currentUserAns.trim()) return;
    setCheckedSteps((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = async () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Final step -> Submit to server
      await handleSubmitAssessment();
    }
  };

  const handleSubmitAssessment = async () => {
    try {
      setIsSubmitting(true);
      const answersPayload = questions.map((q, idx) => {
        const uVal = (userAnswers[idx] || "").trim().toLowerCase();
        const isCorrect = uVal === q.correctAnswer.trim().toLowerCase();
        return {
          questionId: q._id || `q_${idx}`,
          questionXp: q.xp || 20,
          isCorrect,
        };
      });

      const duration = Math.round((Date.now() - startedAt.current) / 1000);

      const res = await progressApi.submitExercise({
        courseId,
        chapterId,
        answers: answersPayload,
        duration,
      });

      if (res.data) {
        const data = res.data;
        setResultScore(data.scorePercent ?? 0);
        setIsPassed(!!data.isPassed);
        setEarnedXp(data.earnedXp ?? 0);
        setAlreadyRewarded(!!data.alreadyRewarded);
        setFinished(true);

        if (data.isPassed) {
          triggerConfetti();
        }
      }
    } catch (e) {
      console.error("Failed to submit assessment:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!exercise || total === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[var(--surface-page)] p-6">
        <p className="text-[var(--text-muted)]">
          No assessment questions found for this chapter.
        </p>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-xl bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-bold text-slate-950"
        >
          Back to Course
        </button>
      </div>
    );
  }

  // ==========================================
  // RESULTS / SCORE SUMMARY SCREEN
  // ==========================================
  if (finished) {
    const totalXpObtainable = questions.reduce(
      (sum, q) => sum + (q.xp || 20),
      0,
    );
    const correctCount = questions.filter(
      (q, idx) =>
        (userAnswers[idx] || "").trim().toLowerCase() ===
        q.correctAnswer.trim().toLowerCase(),
    ).length;

    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[var(--surface-page)] text-[var(--ink-900)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-page)]/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Award className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--ink-900)]">
                Assessment Results
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {chapterTitle || exercise.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-card)] transition-colors hover:bg-[var(--line)]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-2xl flex-1 px-4 py-8">
          {/* Main Score Card */}
          <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center shadow-lg">
            <div
              className={`mx-auto mb-4 flex size-20 items-center justify-center rounded-3xl ${
                isPassed
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              <Award className="size-10" />
            </div>

            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                isPassed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isPassed ? "Assessment Passed! 🏆" : "Keep Practicing"}
            </span>

            <h1 className="mt-3 text-3xl font-extrabold text-[var(--ink-900)]">
              {resultScore}% Score
            </h1>

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              You answered{" "}
              <span className="font-bold text-[var(--ink-900)]">
                {correctCount}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[var(--ink-900)]">{total}</span>{" "}
              questions correctly.
            </p>

            {/* XP Status Callout */}
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-4">
              {alreadyRewarded ? (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                  <Zap className="size-4 text-amber-500" />
                  <span>
                    Rewards already claimed previously for this assessment.
                    (Practice Mode)
                  </span>
                </div>
              ) : earnedXp > 0 ? (
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-600">
                  <Zap className="size-5 fill-amber-500 text-amber-500" />
                  <span>+{earnedXp} XP Added to Your Profile!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                  <Award className="size-4 text-amber-500" />
                  <span>
                    Score at least 50% to earn up to +{totalXpObtainable} XP.
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={onClose}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--brand-gold)] px-6 py-3.5 text-sm font-bold text-slate-950 shadow-md transition-all hover:brightness-105"
              >
                <span>Back to Course</span>
              </button>
              <button
                onClick={initQuestions}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] px-6 py-3.5 text-sm font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--line)]"
              >
                <RotateCcw className="size-4" />
                <span>Retake Assessment</span>
              </button>
            </div>
          </div>

          {/* Question-by-Question Review Breakdown */}
          <div className="mt-10 space-y-4">
            <h3 className="text-lg font-bold text-[var(--ink-900)]">
              Review Your Answers
            </h3>
            {questions.map((q, idx) => {
              const uAns = userAnswers[idx] || "";
              const isCorrect =
                uAns.trim().toLowerCase() ===
                q.correctAnswer.trim().toLowerCase();

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 transition-all ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-red-200 bg-red-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {isCorrect ? "✓" : "✗"}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Question {idx + 1}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {q.type === "fill_in_blank"
                        ? "Fill-in-the-Blank"
                        : "Multiple Choice"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-[var(--ink-900)]">
                    <RichText text={q.question} />
                  </p>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-muted)]">
                        Your Answer:
                      </span>
                      <span
                        className={`font-bold ${isCorrect ? "text-emerald-700" : "text-red-600"}`}
                      >
                        {uAns || "(No Answer)"}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-muted)]">
                          Correct Answer:
                        </span>
                        <span className="font-bold text-emerald-700">
                          <RichText text={q.correctAnswer} />
                        </span>
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-3 text-xs text-[var(--text-muted)]">
                      <span className="font-bold text-[var(--ink-900)]">
                        Explanation:{" "}
                      </span>
                      <RichText text={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP-BY-STEP QUESTION PLAYER SCREEN
  // ==========================================
  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);
  const optionsToRender = currentQ.shuffledOptions || currentQ.options || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--surface-page)] text-[var(--ink-900)]">
      {/* Top Header & Progress Bar */}
      <header className="border-b border-[var(--line)] bg-[var(--surface-page)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-card)] transition-colors hover:bg-[var(--line)]"
            >
              <X className="size-5 text-[var(--ink-900)]" />
            </button>
            <div>
              <h2 className="line-clamp-1 text-sm font-bold text-[var(--ink-900)]">
                {exercise.title || "Chapter Capstone Assessment"}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Question {currentIndex + 1} of {total}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            <Zap className="size-3.5 fill-amber-500 text-amber-500" />
            <span>+{currentQ.xp || 20} XP</span>
          </div>
        </div>

        {/* Continuous Top Progress Bar */}
        <div className="h-1.5 w-full bg-[var(--surface-sunken)]">
          <div
            className="h-full bg-[var(--brand-gold)] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Question Card Area */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-between overflow-y-auto px-4 py-6 sm:px-6">
        <div className="space-y-6">
          {/* Question Tag & Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
                {currentQ.type === "fill_in_blank"
                  ? "Fill in the Blank"
                  : "Multiple Choice"}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                Step {currentIndex + 1} of {total}
              </span>
            </div>

            <h1 className="text-lg font-bold text-[var(--ink-900)] sm:text-xl">
              <RichText text={currentQ.question} />
            </h1>
          </div>

          {/* Interactive Answer Input */}
          {currentQ.type === "mcq" ? (
            <div className="space-y-2.5">
              {optionsToRender.map((option, oIdx) => {
                const isSelected = currentUserAns === option;
                const letter = String.fromCharCode(65 + oIdx);

                let optionStyle =
                  "border-[var(--line)] bg-[var(--surface-card)] hover:border-[var(--brand-gold-400)] hover:bg-[var(--surface-sunken)]";

                if (isSelected && !isCurrentChecked) {
                  optionStyle =
                    "border-[var(--brand-gold)] bg-amber-50/60 shadow-xs ring-2 ring-[var(--brand-gold)]/30";
                } else if (isCurrentChecked) {
                  if (option === currentQ.correctAnswer) {
                    optionStyle =
                      "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300";
                  } else if (isSelected && !isCurrentCorrect) {
                    optionStyle =
                      "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-300";
                  } else {
                    optionStyle =
                      "border-[var(--line)] bg-[var(--surface-card)]/40 opacity-50";
                  }
                }

                return (
                  <button
                    key={oIdx}
                    disabled={isCurrentChecked}
                    onClick={() => handleSelectOption(option)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition-all ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
                          isSelected
                            ? "bg-[var(--brand-gold)] text-slate-950"
                            : "bg-[var(--surface-sunken)] text-[var(--text-muted)]"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm font-semibold text-[var(--ink-900)]">
                        <RichText text={option} />
                      </span>
                    </div>

                    {isCurrentChecked && option === currentQ.correctAnswer && (
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                    )}
                    {isCurrentChecked && isSelected && !isCurrentCorrect && (
                      <XCircle className="size-5 shrink-0 text-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Type your answer below:
              </label>
              <input
                type="text"
                disabled={isCurrentChecked}
                value={currentUserAns}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !isCurrentChecked &&
                    currentUserAns.trim()
                  ) {
                    handleCheckAnswer();
                  }
                }}
                placeholder="e.g. tokens"
                autoFocus
                className={`w-full rounded-2xl border p-4 text-base font-semibold text-[var(--ink-900)] outline-none transition-all ${
                  isCurrentChecked
                    ? isCurrentCorrect
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300"
                      : "border-red-500 bg-red-50 ring-2 ring-red-300"
                    : "border-[var(--line)] bg-[var(--surface-card)] focus:border-[var(--brand-gold)] focus:ring-4 focus:ring-[var(--brand-gold)]/20"
                }`}
              />
            </div>
          )}

          {/* Answer Feedback & Explanation Box */}
          {isCurrentChecked && (
            <div
              className={`animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-2xl border p-4 ${
                isCurrentCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-red-200 bg-red-50 text-red-950"
              }`}
            >
              <div className="flex items-center gap-2">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <span className="text-sm font-extrabold text-emerald-800">
                      Correct! Great job!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-5 text-red-600" />
                    <span className="text-sm font-extrabold text-red-800">
                      Not quite. Correct answer:{" "}
                      <span className="underline">
                        <RichText text={currentQ.correctAnswer} />
                      </span>
                    </span>
                  </>
                )}
              </div>

              {currentQ.explanation && (
                <div className="mt-2 border-t border-black/5 pt-2 text-xs leading-relaxed opacity-90">
                  <span className="font-bold">Why: </span>
                  <RichText text={currentQ.explanation} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation & Check Bar */}
        <div className="mt-8 border-t border-[var(--line)] pt-4">
          {!isCurrentChecked ? (
            <button
              disabled={!currentUserAns.trim()}
              onClick={handleCheckAnswer}
              className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold shadow-md transition-all ${
                currentUserAns.trim()
                  ? "bg-[var(--brand-gold)] text-slate-950 hover:brightness-105"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 opacity-70"
              }`}
            >
              <span>Check Answer</span>
            </button>
          ) : (
            <button
              disabled={isSubmitting}
              onClick={handleNext}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--brand-gold)] py-3.5 text-sm font-bold text-slate-950 shadow-md transition-all hover:brightness-105"
            >
              <span>
                {isSubmitting
                  ? "Submitting Assessment..."
                  : currentIndex < total - 1
                    ? "Continue to Next Question →"
                    : "Complete Assessment →"}
              </span>
              {!isSubmitting && <ArrowRight className="size-4" />}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
