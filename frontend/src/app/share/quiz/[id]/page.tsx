"use client";

import { useState, useEffect, use, useRef } from "react";
import { cn } from "@/lib/cn";
import { ShareBanner } from "@/components/ShareBanner";
import { formatMarkdown } from "@/lib/markdown";
import { AddToLibraryButton } from "@/components/AddToLibraryButton";
import Link from "next/link";
import { gsap } from "gsap";
import confetti from "canvas-confetti";
import QuizOverview from "@/components/quiz/QuizOverview";
import OptionCard from "@/components/quiz/OptionCard";

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

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
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode | null>("immediate");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [fillBlankInput, setFillBlankInput] = useState<string>("");
  const [error, setError] = useState("");
  const [savedProgressData, setSavedProgressData] = useState<{
    currentQ: number;
    answers: Record<number, string>;
    feedbackMode: FeedbackMode;
    maxReachedIndex?: number;
  } | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Expanded taking features
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  const questionRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const [prevCurrentQ, setPrevCurrentQ] = useState(currentQ);
  if (currentQ !== prevCurrentQ) {
    setFillBlankInput(answers[currentQ] || "");
    setPrevCurrentQ(currentQ);
  }

  // Update maxReachedIndex when currentQ changes
  useEffect(() => {
    setMaxReachedIndex((prev) => Math.max(prev, currentQ));
  }, [currentQ]);

  // GSAP animation for question entry
  useEffect(() => {
    if (questionRef.current) {
      gsap.fromTo(
        questionRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [currentQ]);

  // GSAP animation for feedback panel entry
  const hasAnsweredCurrent = answers[currentQ] !== undefined;
  useEffect(() => {
    if ((hasAnsweredCurrent || isReviewing) && feedbackRef.current) {
      gsap.fromTo(
        feedbackRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [hasAnsweredCurrent, isReviewing, currentQ]);

  // Confetti celebration & score counting
  useEffect(() => {
    if (submitted && quiz) {
      const percentage = Math.round((score / quiz.questions.length) * 100);
      if (percentage >= 70) {
        // Confetti burst
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      // Count up score
      let startTime = performance.now();
      const duration = 1500;
      const animateCount = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(eased * score));

        if (progress < 1) {
          requestAnimationFrame(animateCount);
        }
      };
      requestAnimationFrame(animateCount);
    }
  }, [submitted, score, quiz]);

  // Fetch Public Quiz
  useEffect(() => {
    const fetchPublicQuiz = async () => {
      try {
        const res = await fetch(`/api/share?id=${id}&type=quiz`);
        const data = await res.json();
        if (data.success && data.quiz) {
          const quizData = data.quiz;
          const shuffledQuestions = quizData.questions?.map((q: Question) => {
            if (q.type === "multiple-choice" && q.options && q.options.length > 0) {
              return {
                ...q,
                options: shuffleArray(q.options),
              };
            }
            return q;
          }) || [];
          setQuiz({ ...quizData, questions: shuffledQuestions });
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

  // Check for saved progress on mount / quiz load
  useEffect(() => {
    if (quiz && typeof window !== "undefined") {
      const saved = localStorage.getItem(`sabilearn_shared_quiz_progress_${id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            parsed &&
            typeof parsed === "object" &&
            parsed.feedbackMode &&
            parsed.answers &&
            typeof parsed.currentQ === "number"
          ) {
            setSavedProgressData(parsed);
            setShowResumePrompt(true);
          }
        } catch (e) {
          console.error("Failed to parse saved progress", e);
        }
      }
    }
  }, [quiz, id]);

  // Save progress on change
  useEffect(() => {
    if (quiz && feedbackMode && !submitted && !isReviewing && typeof window !== "undefined") {
      const progress = {
        currentQ,
        answers,
        feedbackMode,
        maxReachedIndex: Math.max(maxReachedIndex, currentQ),
      };
      localStorage.setItem(`sabilearn_shared_quiz_progress_${id}`, JSON.stringify(progress));
    }
  }, [quiz, id, currentQ, answers, feedbackMode, submitted, maxReachedIndex, isReviewing]);

  const handleResume = () => {
    if (savedProgressData) {
      setAnswers(savedProgressData.answers);
      setCurrentQ(savedProgressData.currentQ);
      setFeedbackMode(savedProgressData.feedbackMode);
      setMaxReachedIndex(savedProgressData.maxReachedIndex || savedProgressData.currentQ);
      setShowModeSelector(false);
      setShowResumePrompt(false);
    }
  };

  const handleRestart = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`sabilearn_shared_quiz_progress_${id}`);
    }
    setAnswers({});
    setCurrentQ(0);
    setMaxReachedIndex(0);
    setFeedbackMode("immediate");
    setIsReviewing(false);
    setShowModeSelector(false);
    setShowResumePrompt(false);
  };

  const selectAnswer = (answer: string) => {
    if (submitted || isReviewing) return;
    if (feedbackMode === "immediate" && answers[currentQ] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
  };

  const submitFillBlankAnswer = () => {
    if (submitted || isReviewing || !fillBlankInput.trim()) return;
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

  const getQuestionOptions = (q: Question) => {
    if (q.type === "true-false") {
      if (q.options && q.options.length > 0) return q.options;
      return ["True", "False"];
    }
    return q.options || [];
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
    setIsReviewing(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`sabilearn_shared_quiz_progress_${id}`);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setIsReviewing(false);
    setScore(0);
    setCurrentQ(0);
    setMaxReachedIndex(0);
    setFillBlankInput("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(`sabilearn_shared_quiz_progress_${id}`);
    }
  };

  const handleReviewAnswers = () => {
    setIsReviewing(true);
    setSubmitted(false);
    setCurrentQ(0);
  };

  // Skip and Navigation functions
  const handleNext = () => {
    if (!quiz) return;
    if (isReviewing) {
      if (currentQ < quiz.questions.length - 1) {
        setCurrentQ((p) => p + 1);
      } else {
        setSubmitted(true);
        setIsReviewing(false);
      }
      return;
    }

    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((p) => p + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQ > 0) {
      setCurrentQ((p) => p - 1);
    }
  };

  const handleSkip = () => {
    if (submitted || isReviewing || !quiz) return;
    if (feedbackMode === "immediate") {
      setAnswers((prev) => ({ ...prev, [currentQ]: "" })); // Mark empty for skipped
    } else {
      handleNext();
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQ(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key;
      const lowerKey = key.toLowerCase();

      // Enter or N for Continue / Next
      if (key === "Enter" || lowerKey === "n") {
        e.preventDefault();
        const continueBtn = document.getElementById("quiz-continue-btn");
        if (continueBtn) {
          continueBtn.click();
        } else {
          handleNext();
        }
        return;
      }

      // Backspace or P for Previous
      if (key === "Backspace" || lowerKey === "p") {
        e.preventDefault();
        handlePrevious();
        return;
      }

      // S to Skip
      if (lowerKey === "s") {
        e.preventDefault();
        handleSkip();
        return;
      }

      // Option selections (A-D or 1-4)
      if (!submitted && !isReviewing && quiz) {
        const question = quiz.questions[currentQ];
        if (question && question.type !== "fill-in-the-blank") {
          const opts = getQuestionOptions(question);
          let idx = -1;
          if (key === "1" || lowerKey === "a") idx = 0;
          if (key === "2" || lowerKey === "b") idx = 1;
          if (key === "3" || lowerKey === "c") idx = 2;
          if (key === "4" || lowerKey === "d") idx = 3;

          if (idx !== -1 && opts[idx] !== undefined && !hasAnsweredCurrent) {
            e.preventDefault();
            selectAnswer(opts[idx]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQ, answers, isReviewing, quiz, feedbackMode, submitted]);

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

  const resumeModal = showResumePrompt && savedProgressData && quiz && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-lg)] animate-in scale-in duration-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)] mb-2">
              Resume Quiz?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              We found your previous attempt for <strong>{quiz.title}</strong>. Would you like to pick up where you left off at question {savedProgressData.currentQ + 1} or start fresh?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleResume}
                className="flex-1 px-5 py-3 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-sm text-center cursor-pointer"
              >
                Resume Attempt
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-semibold hover:bg-[var(--bg-tertiary)] hover:border-[var(--text-muted)] text-[var(--text-primary)] transition-all text-center cursor-pointer"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
        {resumeModal}
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const isSkipped = answers[currentQ] === "";
  const currentAnswerCorrect = hasAnsweredCurrent && !isSkipped
    ? isAnswerCorrect(currentQ, answers[currentQ])
    : false;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <ShareBanner />
      <div className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto flex items-center justify-center">
        {submitted ? (
          <div className="w-full max-w-md mx-auto text-center py-10">
            <div className="text-5xl font-bold font-[family-name:var(--font-display)] mb-4">
              {displayScore}/{quiz.questions.length}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              {score === quiz.questions.length
                ? "Perfect score! You're a master!"
                : score >= quiz.questions.length / 2
                  ? "Good job! Keep learning!"
                  : "Keep practicing! You'll get better!"}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <button
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-semibold hover:border-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Retry quiz
              </button>
              <button
                onClick={handleReviewAnswers}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Review Answers
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <AddToLibraryButton resourceId={id} type="quiz" initialAdded={added} />
            </div>
          </div>
        ) : (
          <div className="quiz-layout-wrapper">
            <div className="quiz-main-column w-full">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-2 flex-wrap justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold">{quiz.title}</h1>
                  </div>
                  {isReviewing && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 animate-pulse">
                      Review Mode
                    </span>
                  )}
                </div>

                {/* Progress Bar (Hidden in Review Mode since we have Sidebar) */}
                {!isReviewing && (
                  <div className="flex items-center gap-2 mb-8">
                    {quiz.questions.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          i === currentQ
                            ? "bg-[var(--accent)]"
                            : answers[i] !== undefined
                              ? answers[i] === ""
                                ? "bg-[var(--warning)]/50" // Skipped
                                : "bg-[var(--accent)]/40"  // Answered
                              : "bg-[var(--bg-elevated)]"
                        )}
                      />
                    ))}
                  </div>
                )}

                <div className="mb-2 text-xs text-[var(--text-muted)]">
                  Question {currentQ + 1} of {quiz.questions.length} • {question.type.replace(/-/g, " ")}
                </div>

                <div
                  ref={questionRef}
                  className="text-lg font-semibold mb-6 prose max-w-none [&_p]:m-0 [&_p]:inline text-[var(--text-primary)]"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(question.question) }}
                />

                {question.type === "fill-in-the-blank" ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={
                          (feedbackMode === "immediate" && hasAnsweredCurrent) || isReviewing
                            ? answers[currentQ] || ""
                            : fillBlankInput
                        }
                        onChange={(e) => setFillBlankInput(e.target.value)}
                        onKeyDown={feedbackMode === "immediate" ? handleFillBlankKeyDown : undefined}
                        disabled={(feedbackMode === "immediate" && hasAnsweredCurrent) || isReviewing}
                        placeholder={isSkipped ? "Skipped" : "Type your answer..."}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border text-sm focus:outline-none focus:border-[var(--accent)] transition-colors text-[var(--text-primary)]",
                          ((feedbackMode === "immediate" && hasAnsweredCurrent) || isReviewing)
                            ? isSkipped
                              ? "border-[var(--warning)] bg-[var(--warning)]/10"
                              : currentAnswerCorrect
                                ? "border-[var(--success)] bg-[var(--success)]/10"
                                : "border-[var(--danger)] bg-[var(--danger)]/10"
                            : "border-[var(--border)]"
                        )}
                      />
                      {feedbackMode === "immediate" && !hasAnsweredCurrent && !isReviewing && (
                        <button
                          onClick={submitFillBlankAnswer}
                          disabled={!fillBlankInput.trim()}
                          className="px-4 py-3 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold disabled:opacity-50 hover:bg-[var(--accent-hover)] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Check Answer
                        </button>
                      )}
                    </div>

                    {/* Immediate feedback explanation for fill-in-the-blank */}
                    {(((feedbackMode === "immediate" && hasAnsweredCurrent) || isReviewing)) && (
                      <div
                        ref={feedbackRef}
                        className={cn(
                          "p-4 rounded-xl border text-sm",
                          isSkipped
                            ? "border-[var(--warning)]/30 bg-[var(--warning)]/5"
                            : currentAnswerCorrect
                              ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                              : "border-[var(--danger)]/30 bg-[var(--danger)]/5"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {isSkipped ? (
                            <span className="font-medium text-[var(--warning)]">Skipped</span>
                          ) : currentAnswerCorrect ? (
                            <span className="font-medium text-[var(--success)]">Correct!</span>
                          ) : (
                            <span className="font-medium text-[var(--danger)]">Incorrect</span>
                          )}
                        </div>
                        {(!currentAnswerCorrect || isSkipped) && (
                          <div className="text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-1 flex-wrap">
                            <span>Correct answer: </span>
                            <span
                              className="font-medium text-[var(--success)] prose max-w-none [&_p]:m-0 [&_p]:inline"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(question.answer) }}
                            />
                          </div>
                        )}
                        {question.explanation && (
                          <div
                            className="text-sm text-[var(--text-muted)] prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: formatMarkdown(question.explanation) }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getQuestionOptions(question).map((opt, idx) => {
                      const isSelected = answers[currentQ] === opt;
                      const isThisCorrectAnswer = question.answer.toLowerCase().trim() === opt.toLowerCase().trim();
                      return (
                        <OptionCard
                          key={`${currentQ}-${idx}`}
                          optionText={opt}
                          index={idx}
                          isSelected={isSelected}
                          isCorrect={currentAnswerCorrect}
                          showResult={(feedbackMode === "immediate" && hasAnsweredCurrent) || isReviewing}
                          isCorrectAnswer={isThisCorrectAnswer}
                          onSelect={selectAnswer}
                          disabled={(feedbackMode === "immediate" && hasAnsweredCurrent) || isReviewing}
                        />
                      );
                    })}

                    {/* Immediate feedback explanation for choices */}
                    {(((feedbackMode === "immediate" && hasAnsweredCurrent) || isReviewing)) && (
                      <div
                        ref={feedbackRef}
                        className={cn(
                          "p-4 rounded-xl border text-sm mt-4",
                          isSkipped
                            ? "border-[var(--warning)]/30 bg-[var(--warning)]/5"
                            : currentAnswerCorrect
                              ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                              : "border-[var(--danger)]/30 bg-[var(--danger)]/5"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {isSkipped ? (
                            <span className="font-medium text-[var(--warning)]">Skipped</span>
                          ) : currentAnswerCorrect ? (
                            <span className="font-medium text-[var(--success)]">Correct!</span>
                          ) : (
                            <span className="font-medium text-[var(--danger)]">Incorrect</span>
                          )}
                        </div>
                        {(!currentAnswerCorrect || isSkipped) && (
                          <div className="text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-1 flex-wrap">
                            <span>Correct answer: </span>
                            <span
                              className="font-medium text-[var(--success)] prose max-w-none [&_p]:m-0 [&_p]:inline"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(question.answer) }}
                            />
                          </div>
                        )}
                        {question.explanation && (
                          <div
                            className="text-sm text-[var(--text-muted)] prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: formatMarkdown(question.explanation) }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation actions wrapper */}
                <div className="flex items-center justify-between mt-8">
                  {/* Previous button */}
                  <button
                    onClick={handlePrevious}
                    disabled={currentQ === 0}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Skip button (only shown if unanswered & not reviewing) */}
                    {!hasAnsweredCurrent && !isReviewing && (
                      <button
                        onClick={handleSkip}
                        className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] text-sm transition-all cursor-pointer"
                      >
                        Skip Question
                      </button>
                    )}

                    {/* Next / Continue button */}
                    {isReviewing ? (
                      <button
                        id="quiz-continue-btn"
                        onClick={handleNext}
                        className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        {currentQ === quiz.questions.length - 1 ? "Back to Results" : "Next"}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : feedbackMode === "immediate" ? (
                      hasAnsweredCurrent && (
                        <button
                          id="quiz-continue-btn"
                          onClick={handleNext}
                          className={cn(
                            "px-6 py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer",
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
                      )
                    ) : (
                      // Traditional mode
                      currentQ === quiz.questions.length - 1 ? (
                        <button
                          id="quiz-continue-btn"
                          onClick={handleSubmit}
                          disabled={Object.keys(answers).length < quiz.questions.length}
                          className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold disabled:opacity-50 hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
                        >
                          Submit Quiz
                        </button>
                      ) : (
                        <button
                          id="quiz-continue-btn"
                          onClick={handleNext}
                          className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors cursor-pointer"
                        >
                          Next →
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Question grid progress sidebar */}
            <QuizOverview
              questions={quiz.questions}
              userAnswers={answers}
              currentQuestionIndex={currentQ}
              maxReachedIndex={maxReachedIndex}
              onQuestionClick={handleJumpToQuestion}
            />
          </div>
        )}
      </div>
      {resumeModal}
    </div>
  );
}
