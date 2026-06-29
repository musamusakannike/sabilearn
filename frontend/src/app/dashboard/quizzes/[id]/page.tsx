"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ShareButton } from "@/components/ShareButton";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  question: string;
  type: "multiple-choice" | "true-false" | "fill-in-the-blank";
  options?: string[];
  answer: string;
  explanation: string;
}

interface Quiz {
  _id: string;
  title: string;
  topic: string;
  questions: Question[];
}

type FeedbackMode = "traditional" | "immediate";

// ─── 3D Flippable Flashcard Component ──────────────────────────────────────────
interface FlashCardProps {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  isCorrect: boolean;
  isBookmarked: boolean;
  bookmarkBusy: boolean;
  onToggleBookmark: () => void;
}

function FlashCard({
  question,
  correctAnswer,
  userAnswer,
  explanation,
  isCorrect,
  isBookmarked,
  bookmarkBusy,
  onToggleBookmark,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 80;
    const velocityThreshold = 400;
    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > velocityThreshold) {
      setIsFlipped((f) => !f);
    }
  };

  return (
    <div className="w-full">
      {/* Your answer label */}
      <div className={cn(
        "flex items-center justify-between gap-3 mb-3 px-1",
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
            isCorrect ? "bg-[var(--success)]/15" : "bg-[var(--danger)]/15"
          )}>
            {isCorrect ? (
              <svg className="w-3 h-3 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Your answer: <span className={cn("font-semibold", isCorrect ? "text-[var(--success)]" : "text-[var(--danger)]")}>{userAnswer}</span>
          </span>
        </div>
        {!isCorrect && (
          <button
            onClick={onToggleBookmark}
            disabled={bookmarkBusy}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
            className={cn(
              "p-1.5 rounded-lg transition-colors disabled:opacity-50",
              isBookmarked
                ? "text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}
      </div>

      {/* 3D Flashcard */}
      <div
        className="relative w-full max-w-lg mx-auto cursor-pointer select-none"
        style={{ perspective: "1000px", height: "200px" }}
        onClick={() => setIsFlipped((f) => !f)}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 180 }}
          whileHover={{ scale: 1.01 }}
        >
          {/* Front — Question */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-6 text-center rounded-2xl border",
              "bg-[var(--bg-secondary)] border-[var(--border)]"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-base sm:text-lg font-medium tracking-tight text-[var(--text-primary)] leading-snug">
              {question}
            </p>
            <p className="text-xs font-mono tracking-wide text-[var(--text-muted)] mt-4 opacity-75">
              touch to see the answer
            </p>
          </div>

          {/* Back — Correct Answer */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-6 text-center rounded-2xl border",
              isCorrect
                ? "bg-[var(--success)]/8 border-[var(--success)]/30"
                : "bg-[var(--accent-subtle)] border-[var(--accent)]/20"
            )}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-2 uppercase opacity-70">
              Correct Answer
            </p>
            <p className="text-lg sm:text-xl font-medium tracking-tight leading-snug" style={{ color: isCorrect ? "var(--success)" : "var(--accent)" }}>
              {correctAnswer}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Explanation — below card */}
      {explanation && (
        <div className="mt-3 px-1">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wide text-[10px]">Explanation </span>
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}

export default function QuizTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(true);
  // Separate input state for fill-in-the-blank to allow typing before submitting
  const [fillBlankInput, setFillBlankInput] = useState<string>("");
  // Review mode: bookmarks + practice generation
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const [bookmarkBusy, setBookmarkBusy] = useState<number | null>(null);
  const [generatingPractice, setGeneratingPractice] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  // Sync fillBlankInput when navigating questions
  useEffect(() => {
    // In traditional mode: show saved answer if any
    // In immediate mode: show saved answer (locked) or clear for new question
    setFillBlankInput(answers[currentQ] || "");
  }, [currentQ, answers]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/ai/quiz?id=${id}`);
      const data = await res.json();
      if (data.success) setQuiz(data.quiz);
      else router.push("/dashboard/quizzes");
    } catch {
      router.push("/dashboard/quizzes");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (answer: string) => {
    if (submitted) return;
    // In immediate feedback mode, lock the answer after selection
    if (feedbackMode === "immediate" && answers[currentQ]) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
  };

  // For fill-in-the-blank: submit the current input value as the answer
  const submitFillBlankAnswer = () => {
    if (submitted || !fillBlankInput.trim()) return;
    selectAnswer(fillBlankInput.trim());
  };

  // Handle Enter key for fill-in-the-blank
  const handleFillBlankKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && fillBlankInput.trim()) {
      e.preventDefault();
      submitFillBlankAnswer();
    }
  };

  const isAnswerCorrect = (questionIndex: number, answer: string) => {
    if (!quiz) return false;
    const q = quiz.questions[questionIndex];
    return answer.toLowerCase().trim() === q.answer.toLowerCase().trim();
  };

  const getOptionStyle = (opt: string) => {
    const isSelected = answers[currentQ] === opt;
    const hasAnswered = !!answers[currentQ];
    const isCorrectAnswer = question.answer.toLowerCase().trim() === opt.toLowerCase().trim();

    // Immediate feedback mode styling
    if (feedbackMode === "immediate" && hasAnswered) {
      if (isCorrectAnswer) {
        return "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]";
      }
      if (isSelected && !isCorrectAnswer) {
        return "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]";
      }
      return "border-[var(--border)] bg-[var(--bg-secondary)] opacity-60";
    }

    // Traditional mode or no selection yet
    if (isSelected) {
      return "border-[var(--accent)] bg-[var(--accent-muted)]";
    }
    return "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--bg-secondary)]";
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
        correct++;
      }
    });
    setScore(correct);
    setSubmitted(true);

    try {
      await fetch("/api/ai/quiz", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: id, score: correct, total: quiz.questions.length }),
      });
    } catch {
      // silent
    }
  };

  // Retake the quiz from scratch
  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setCurrentQ(0);
    setFillBlankInput("");
    setReviewError("");
    setBookmarked({});
  };

  const missedIndices = quiz
    ? quiz.questions
        .map((q, i) => (answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim() ? -1 : i))
        .filter((i) => i >= 0)
    : [];

  const toggleBookmark = async (index: number) => {
    if (!quiz) return;
    setBookmarkBusy(index);
    const q = quiz.questions[index];
    const currentlyBookmarked = !!bookmarked[index];
    try {
      if (currentlyBookmarked) {
        await fetch(
          `/api/ai/quiz/bookmarks?sourceQuizId=${id}&question=${encodeURIComponent(q.question)}`,
          { method: "DELETE" }
        );
        setBookmarked((prev) => ({ ...prev, [index]: false }));
      } else {
        await fetch("/api/ai/quiz/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceQuizId: id,
            sourceQuizTitle: quiz.title,
            question: q.question,
            type: q.type,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
          }),
        });
        setBookmarked((prev) => ({ ...prev, [index]: true }));
      }
    } catch {
      setReviewError("Couldn't update bookmark. Try again.");
    } finally {
      setBookmarkBusy(null);
    }
  };

  const generatePracticeQuiz = async () => {
    if (missedIndices.length === 0) return;
    setGeneratingPractice(true);
    setReviewError("");
    try {
      const res = await fetch("/api/ai/quiz/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: id, questionIndices: missedIndices }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to generate practice quiz");
      } else {
        router.push(`/dashboard/quizzes/${data.quizId}`);
      }
    } catch {
      setReviewError("Something went wrong");
    } finally {
      setGeneratingPractice(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Mode selector screen
  if (showModeSelector) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/dashboard/quizzes")}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-4 sm:mb-6"
        >
          ← Back to quizzes
        </button>

        <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          {quiz.questions.length} questions • Choose how you want to receive feedback
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Traditional Mode */}
          <button
            onClick={() => {
              setFeedbackMode("traditional");
              setShowModeSelector(false);
            }}
            className="p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-secondary)] hover:bg-[var(--accent-muted)] transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent)]/20 transition-colors">
              <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-base mb-2">Review at the End</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Answer all questions first, then see your score and review all corrections together.
            </p>
          </button>

          {/* Immediate Feedback Mode */}
          <button
            onClick={() => {
              setFeedbackMode("immediate");
              setShowModeSelector(false);
            }}
            className="p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--success)] bg-[var(--bg-secondary)] hover:bg-[var(--success)]/5 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--success)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--success)]/20 transition-colors">
              <svg className="w-6 h-6 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-base mb-2">Instant Feedback</h3>
            <p className="text-sm text-[var(--text-muted)]">
              See if you&apos;re right immediately with color highlights and explanations after each answer.
            </p>
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const hasAnsweredCurrent = !!answers[currentQ];
  const currentAnswerCorrect = hasAnsweredCurrent ? isAnswerCorrect(currentQ, answers[currentQ]) : null;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/dashboard/quizzes")}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-4 sm:mb-6"
      >
        ← Back to quizzes
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold">{quiz.title}</h1>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              feedbackMode === "immediate"
                ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
                : "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
            )}
          >
            {feedbackMode === "immediate" ? "Instant Feedback" : "Review at End"}
          </span>
        </div>
        <ShareButton id={quiz._id} type="quiz" />
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {quiz.questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i === currentQ ? "bg-[var(--accent)]" : answers[i] ? "bg-[var(--accent)]/40" : "bg-[var(--bg-elevated)]"
            )}
          />
        ))}
      </div>

      {submitted ? (
        <div className="text-center py-10">
          <div className="text-5xl font-bold font-[family-name:var(--font-display)] mb-4">
            {score}/{quiz.questions.length}
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            {score === quiz.questions.length ? "Perfect score!" : score >= quiz.questions.length / 2 ? "Good job!" : "Keep practicing!"}
          </p>

          {/* Review actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-2">
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-semibold hover:border-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry quiz
            </button>
            {missedIndices.length > 0 && (
              <button
                onClick={generatePracticeQuiz}
                disabled={generatingPractice}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generatingPractice ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[var(--bg-primary)] border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Practice {missedIndices.length} missed</>
                )}
              </button>
            )}
          </div>
          {reviewError && (
            <p className="text-xs text-[var(--danger)] mb-2">{reviewError}</p>
          )}
          {missedIndices.length > 0 && (
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Bookmark questions to revisit them later for spaced repetition.
            </p>
          )}

          {/* Review — 3D Flippable Flashcards */}
          <div className="text-left space-y-6 mt-4">
            {quiz.questions.map((q, i) => {
              const isCorrect = answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim();
              return (
                <FlashCard
                  key={i}
                  question={q.question}
                  correctAnswer={q.answer}
                  userAnswer={answers[i] || "(none)"}
                  explanation={q.explanation}
                  isCorrect={isCorrect}
                  isBookmarked={!!bookmarked[i]}
                  bookmarkBusy={bookmarkBusy === i}
                  onToggleBookmark={() => toggleBookmark(i)}
                />
              );
            })}
          </div>

          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="mt-8 px-6 py-3 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-sm font-semibold hover:border-[var(--text-muted)] transition-all"
          >
            Back to Quizzes
          </button>
        </div>
      ) : (
        <>
          <div className="mb-2 text-xs text-[var(--text-muted)]">
            Question {currentQ + 1} of {quiz.questions.length} • {question.type.replace(/-/g, " ")}
          </div>
          <h2 className="text-lg font-semibold mb-6">{question.question}</h2>

          {question.type === "fill-in-the-blank" ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feedbackMode === "immediate" && hasAnsweredCurrent ? answers[currentQ] || "" : fillBlankInput}
                  onChange={(e) => setFillBlankInput(e.target.value)}
                  onKeyDown={feedbackMode === "immediate" ? handleFillBlankKeyDown : undefined}
                  disabled={feedbackMode === "immediate" && hasAnsweredCurrent}
                  placeholder="Type your answer..."
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border text-sm focus:outline-none focus:border-[var(--accent)] transition-colors",
                    feedbackMode === "immediate" && hasAnsweredCurrent
                      ? currentAnswerCorrect
                        ? "border-[var(--success)] bg-[var(--success)]/10"
                        : "border-[var(--danger)] bg-[var(--danger)]/10"
                      : "border-[var(--border)]"
                  )}
                />
                {/* Show Check Answer button in immediate feedback mode before answering */}
                {feedbackMode === "immediate" && !hasAnsweredCurrent && (
                  <button
                    onClick={submitFillBlankAnswer}
                    disabled={!fillBlankInput.trim()}
                    className="px-4 py-3 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold disabled:opacity-50 hover:bg-[var(--accent-hover)] transition-colors whitespace-nowrap"
                  >
                    Check Answer
                  </button>
                )}
              </div>
              {/* Immediate feedback for fill-in-the-blank */}
              {feedbackMode === "immediate" && hasAnsweredCurrent && (
                <div className={cn(
                  "p-4 rounded-xl border text-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
                  currentAnswerCorrect
                    ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                    : "border-[var(--danger)]/30 bg-[var(--danger)]/5"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {currentAnswerCorrect ? (
                      <>
                        <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-[var(--success)]">Correct!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="font-medium text-[var(--danger)]">Incorrect</span>
                      </>
                    )}
                  </div>
                  {!currentAnswerCorrect && (
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                      Correct answer: <span className="font-medium text-[var(--success)]">{question.answer}</span>
                    </p>
                  )}
                  <p className="text-sm text-[var(--text-muted)]">{question.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {(question.type === "true-false"
                ? (question.options && question.options.length > 0
                    ? question.options
                    : (question.answer === "true" || question.answer === "false"
                        ? ["true", "false"]
                        : ["True", "False"]))
                : (question.options || [])
              ).map((opt) => {
                const isCorrectAnswer = question.answer.toLowerCase().trim() === opt.toLowerCase().trim();
                const isSelected = answers[currentQ] === opt;
                const showCorrectIcon = feedbackMode === "immediate" && hasAnsweredCurrent && isCorrectAnswer;
                const showIncorrectIcon = feedbackMode === "immediate" && hasAnsweredCurrent && isSelected && !isCorrectAnswer;

                return (
                  <button
                    key={opt}
                    onClick={() => selectAnswer(opt)}
                    disabled={feedbackMode === "immediate" && hasAnsweredCurrent}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between gap-3",
                      getOptionStyle(opt),
                      feedbackMode === "immediate" && hasAnsweredCurrent && !isSelected && !isCorrectAnswer && "cursor-default"
                    )}
                  >
                    <span>{opt}</span>
                    {showCorrectIcon && (
                      <svg className="w-5 h-5 text-[var(--success)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {showIncorrectIcon && (
                      <svg className="w-5 h-5 text-[var(--danger)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
              {/* Immediate feedback explanation panel */}
              {feedbackMode === "immediate" && hasAnsweredCurrent && (
                <div className={cn(
                  "p-4 rounded-xl border text-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
                  currentAnswerCorrect
                    ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                    : "border-[var(--danger)]/30 bg-[var(--danger)]/5"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {currentAnswerCorrect ? (
                      <>
                        <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-[var(--success)]">Correct!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="font-medium text-[var(--danger)]">Incorrect</span>
                      </>
                    )}
                  </div>
                  {!currentAnswerCorrect && (
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                      Correct answer: <span className="font-medium text-[var(--success)]">{question.answer}</span>
                    </p>
                  )}
                  <p className="text-sm text-[var(--text-muted)]">{question.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0 || (feedbackMode === "immediate" && hasAnsweredCurrent)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
            >
              Previous
            </button>

            {feedbackMode === "immediate" ? (
              // Immediate feedback mode: show Continue button after answering
              hasAnsweredCurrent ? (
                <button
                  onClick={() => {
                    if (currentQ === quiz.questions.length - 1) {
                      handleSubmit();
                    } else {
                      setCurrentQ((p) => Math.min(quiz.questions.length - 1, p + 1));
                    }
                  }}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2",
                    currentAnswerCorrect
                      ? "bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
                      : "bg-[var(--accent)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)]"
                  )}
                >
                  {currentQ === quiz.questions.length - 1 ? "Finish Quiz" : "Continue"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <span className="text-sm text-[var(--text-muted)]">Select an answer to continue</span>
              )
            ) : (
              // Traditional mode: standard Next/Submit buttons
              currentQ === quiz.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < quiz.questions.length}
                  className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold disabled:opacity-50 hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQ((p) => Math.min(quiz.questions.length - 1, p + 1))}
                  className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                >
                  Next →
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
