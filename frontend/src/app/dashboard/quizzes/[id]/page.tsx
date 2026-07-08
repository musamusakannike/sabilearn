"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ShareButton } from "@/components/ShareButton";
import { formatMarkdown } from "@/lib/markdown";
import { motion, AnimatePresence } from "framer-motion";
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
      <div className={cn("flex items-center justify-between gap-3 mb-3 px-1")}>
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
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 flex-wrap">
            <span>Your answer:</span>
            <span 
              className={cn("font-semibold prose max-w-none [&_p]:m-0 [&_p]:inline", isCorrect ? "text-[var(--success)]" : "text-[var(--danger)]")}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(userAnswer) }}
            />
          </span>
        </div>
        {!isCorrect && (
          <button
            onClick={onToggleBookmark}
            disabled={bookmarkBusy}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
            className={cn(
              "p-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer",
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
            <div 
              className="text-base sm:text-lg font-medium tracking-tight text-[var(--text-primary)] leading-snug prose max-w-none [&_p]:m-0 [&_p]:inline"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(question) }}
            />
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
            <div 
              className="text-lg sm:text-xl font-medium tracking-tight leading-snug prose max-w-none [&_p]:m-0 [&_p]:inline" 
              style={{ color: isCorrect ? "var(--success)" : "var(--accent)" }}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(correctAnswer) }}
            />
          </div>
        </motion.div>
      </div>

      {/* Explanation — below card */}
      {explanation && (
        <div className="mt-3 px-1 text-left">
          <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wide text-[10px] mr-1">Explanation </span>
            <div className="prose max-w-none inline" dangerouslySetInnerHTML={{ __html: formatMarkdown(explanation) }} />
          </div>
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
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode | null>("immediate");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [savedProgressData, setSavedProgressData] = useState<{
    currentQ: number;
    answers: Record<number, string>;
    feedbackMode: FeedbackMode;
    maxReachedIndex?: number;
  } | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [fillBlankInput, setFillBlankInput] = useState<string>("");

  // Review mode & spaced repetition
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const [bookmarkBusy, setBookmarkBusy] = useState<number | null>(null);
  const [generatingPractice, setGeneratingPractice] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Upgraded interactive features
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [reviewType, setReviewType] = useState<"flashcards" | "interactive">("flashcards");

  const questionRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  // Check for saved progress on mount / quiz load
  useEffect(() => {
    if (quiz && typeof window !== "undefined") {
      const saved = localStorage.getItem(`sabilearn_quiz_progress_${id}`);
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
      localStorage.setItem(`sabilearn_quiz_progress_${id}`, JSON.stringify(progress));
    }
  }, [quiz, id, currentQ, answers, feedbackMode, submitted, maxReachedIndex, isReviewing]);

  // Sync fillBlankInput when navigating questions
  useEffect(() => {
    setFillBlankInput(answers[currentQ] || "");
  }, [currentQ, answers]);

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
      localStorage.removeItem(`sabilearn_quiz_progress_${id}`);
    }
    setAnswers({});
    setCurrentQ(0);
    setMaxReachedIndex(0);
    setFeedbackMode("immediate");
    setIsReviewing(false);
    setShowModeSelector(false);
    setShowResumePrompt(false);
  };

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/ai/quiz?id=${id}`);
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
      } else {
        router.push("/dashboard/quizzes");
      }
    } catch {
      router.push("/dashboard/quizzes");
    } finally {
      setLoading(false);
    }
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
    setIsReviewing(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`sabilearn_quiz_progress_${id}`);
    }

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

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setIsReviewing(false);
    setScore(0);
    setCurrentQ(0);
    setMaxReachedIndex(0);
    setFillBlankInput("");
    setReviewError("");
    setBookmarked({});
    if (typeof window !== "undefined") {
      localStorage.removeItem(`sabilearn_quiz_progress_${id}`);
    }
  };

  const handleReviewAnswersInteractive = () => {
    setReviewType("interactive");
    setIsReviewing(true);
    setSubmitted(false);
    setCurrentQ(0);
  };

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

  const getQuestionOptions = (q: Question) => {
    if (q.type === "true-false") {
      if (q.options && q.options.length > 0) return q.options;
      return ["True", "False"];
    }
    return q.options || [];
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

  // Keyboard navigation hook
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

  if (loading || !quiz) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
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

  // Mode selector screen
  if (showModeSelector) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/dashboard/quizzes")}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-4 sm:mb-6 cursor-pointer"
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
            className="p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-secondary)] hover:bg-[var(--accent-muted)] transition-all text-left group cursor-pointer"
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
            className="p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--success)] bg-[var(--bg-secondary)] hover:bg-[var(--success)]/5 transition-all text-left group cursor-pointer"
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      {submitted ? (
        <div className="max-w-2xl mx-auto text-center py-10">
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

          {/* Toggle between Review Types */}
          <div className="flex items-center justify-center gap-2 mb-6 bg-[var(--bg-secondary)] border border-[var(--border)] p-1.5 rounded-full max-w-xs mx-auto">
            <button
              onClick={() => setReviewType("flashcards")}
              className={cn(
                "flex-1 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                reviewType === "flashcards"
                  ? "bg-[var(--accent)] text-[var(--bg-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Flashcards
            </button>
            <button
              onClick={handleReviewAnswersInteractive}
              className={cn(
                "flex-1 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                reviewType === "interactive"
                  ? "bg-[var(--accent)] text-[var(--bg-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Interactive
            </button>
          </div>

          {reviewType === "flashcards" ? (
            <>
              {/* Review actions for flashcard list */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-2">
                <button
                  onClick={handleRetry}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-semibold hover:border-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                    className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="text-left space-y-6 mt-4 max-w-lg mx-auto">
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
            </>
          ) : null}

          <div className="flex justify-center mt-8 gap-3">
            <button
              onClick={() => router.push("/dashboard/quizzes")}
              className="px-6 py-3 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-sm font-semibold hover:border-[var(--text-muted)] transition-all cursor-pointer"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      ) : (
        <div className="quiz-layout-wrapper">
          <div className="quiz-main-column w-full">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => router.push("/dashboard/quizzes")}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-4 sm:mb-6 flex items-center gap-1 cursor-pointer"
              >
                ← Back to quizzes
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h1 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-[var(--text-primary)]">{quiz.title}</h1>
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
                  {isReviewing && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 animate-pulse">
                      Review Mode
                    </span>
                  )}
                </div>
                <ShareButton id={quiz._id} type="quiz" />
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
                    hasAnsweredCurrent ? (
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
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] italic">
                        Select an answer or skip to continue
                      </span>
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
      {resumeModal}
    </div>
  );
}
