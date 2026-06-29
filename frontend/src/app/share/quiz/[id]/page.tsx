"use client";

import { useState, useEffect, use } from "react";
import { cn } from "@/lib/cn";
import { ShareBanner } from "@/components/ShareBanner";
import { AddToLibraryButton } from "@/components/AddToLibraryButton";
import Link from "next/link";

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

export default function PublicQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [fillBlankInput, setFillBlankInput] = useState<string>("");
  const [error, setError] = useState("");

  const [prevCurrentQ, setPrevCurrentQ] = useState(currentQ);
  if (currentQ !== prevCurrentQ) {
    setFillBlankInput(answers[currentQ] || "");
    setPrevCurrentQ(currentQ);
  }

  useEffect(() => {
    const fetchPublicQuiz = async () => {
      try {
        const res = await fetch(`/api/share?id=${id}&type=quiz`);
        const data = await res.json();
        if (data.success) {
          setQuiz(data.quiz);
          setAdded(!!data.added);
        } else {
          setError(data.error || "Shared quiz not found");
        }
      } catch {
        setError("Failed to load shared quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicQuiz();
  }, [id]);

  const selectAnswer = (answer: string) => {
    if (submitted) return;
    if (feedbackMode === "immediate" && answers[currentQ]) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
  };

  const submitFillBlankAnswer = () => {
    if (submitted || !fillBlankInput.trim()) return;
    selectAnswer(fillBlankInput.trim());
  };

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

    if (feedbackMode === "immediate" && hasAnswered) {
      if (isCorrectAnswer) {
        return "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]";
      }
      if (isSelected && !isCorrectAnswer) {
        return "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]";
      }
      return "border-[var(--border)] bg-[var(--bg-secondary)] opacity-60";
    }

    if (isSelected) {
      return "border-[var(--accent)] bg-[var(--accent-muted)]";
    }
    return "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--bg-secondary)]";
  };

  const handleSubmit = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
        correct++;
      }
    });
    setScore(correct);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setCurrentQ(0);
    setFillBlankInput("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
        <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg-primary)] text-center p-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)] mb-4">
          Quiz Not Available
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">
          {error || "This quiz has been set to private or does not exist."}
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
        >
          Go to Sabi Learn Home
        </Link>
      </div>
    );
  }

  if (showModeSelector) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        <ShareBanner />
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col justify-center">
          <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {quiz.questions.length} questions • Choose how you want to receive feedback
          </p>

          <div className="mb-8">
            <AddToLibraryButton resourceId={id} type="quiz" initialAdded={added} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const hasAnsweredCurrent = !!answers[currentQ];
  const currentAnswerCorrect = hasAnsweredCurrent ? isAnswerCorrect(currentQ, answers[currentQ]) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <ShareBanner />
      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-2xl mx-auto w-full flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
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

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <button
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-semibold hover:border-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center gap-2"
              >
                Retry quiz
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <AddToLibraryButton resourceId={id} type="quiz" initialAdded={added} />
            </div>

            {/* Review */}
            <div className="text-left space-y-4 mt-4">
              {quiz.questions.map((q, i) => {
                const isCorrect = answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim();
                return (
                  <div key={i} className={cn("p-4 rounded-xl border", isCorrect ? "border-[var(--success)]/30 bg-[var(--success)]/5" : "border-[var(--danger)]/30 bg-[var(--danger)]/5")}>
                    <p className="text-sm font-medium mb-1">{q.question}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Your answer: {answers[i] || "(none)"} • Correct: {q.answer}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-2">{q.explanation}</p>
                  </div>
                );
              })}
            </div>
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
                {feedbackMode === "immediate" && hasAnsweredCurrent && (
                  <div className={cn(
                    "p-4 rounded-xl border text-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
                    currentAnswerCorrect
                      ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                      : "border-[var(--danger)]/30 bg-[var(--danger)]/5"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {currentAnswerCorrect ? (
                        <span className="font-medium text-[var(--success)]">Correct!</span>
                      ) : (
                        <span className="font-medium text-[var(--danger)]">Incorrect</span>
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
                {feedbackMode === "immediate" && hasAnsweredCurrent && (
                  <div className={cn(
                    "p-4 rounded-xl border text-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
                    currentAnswerCorrect
                      ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                      : "border-[var(--danger)]/30 bg-[var(--danger)]/5"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {currentAnswerCorrect ? (
                        <span className="font-medium text-[var(--success)]">Correct!</span>
                      ) : (
                        <span className="font-medium text-[var(--danger)]">Incorrect</span>
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
    </div>
  );
}
