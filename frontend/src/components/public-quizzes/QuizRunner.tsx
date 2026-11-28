'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Flag,
  LayoutGrid,
  SkipForward,
  XCircle,
} from 'lucide-react';
import {
  ALL_UIL_GET311_QUESTIONS,
  buildAllQuestionsTopic,
  buildCustomQuizTopic,
  buildRandomQuizTopic,
  getTopicById,
  reconstructQuizTopic,
} from '@/data/public-quizzes/uil-get311';
import {
  PublicQuizOption,
  PublicQuizTopic,
  RecommendedCourse,
} from '@/types/public-quiz';
import { shuffleOptions } from '@/utils/shuffleOptions';
import {
  clearPublicQuizProgress,
  getPublicQuizProgress,
  savePublicQuizProgress,
} from '@/utils/publicQuizStorage';
import { RichText } from '@/components/lesson/RichText';
import QuizProgress from './QuizProgress';
import OptionCard from './OptionCard';
import QuizOverview from './QuizOverview';
import QuizResults from './QuizResults';
import ResumeQuizModal from './ResumeQuizModal';

interface QuizRunnerProps {
  topicId: string;
  recommendedCourse: RecommendedCourse;
  basePath?: string;
}

export default function QuizRunner({
  topicId,
  recommendedCourse,
  basePath = '/public-quizzes/uil-get311',
}: QuizRunnerProps) {
  const searchParams = useSearchParams();
  const topicsParam = searchParams.get('topics') || '';
  const countParam = searchParams.get('count') || '';

  const sessionKey = useMemo(() => {
    if (topicId === 'random') {
      const n = Number(countParam) || 50;
      return `random_${n}`;
    }
    if (topicId === 'custom') {
      return `custom_${topicsParam}_${countParam || 'all'}`;
    }
    return topicId;
  }, [topicId, topicsParam, countParam]);

  const [topic, setTopic] = useState<PublicQuizTopic | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<
    Record<number, PublicQuizOption[]>
  >({});
  const [isComplete, setIsComplete] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{
    currentQuestion: number;
    answeredCount: number;
    timestamp: number;
  } | null>(null);

  const questionRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const buildFreshTopic = useCallback((): PublicQuizTopic | undefined => {
    if (topicId === 'all') {
      return buildAllQuestionsTopic();
    }
    if (topicId === 'random') {
      const count = Math.min(
        Math.max(1, Number(countParam) || 50),
        ALL_UIL_GET311_QUESTIONS.length
      );
      return buildRandomQuizTopic(count);
    }
    if (topicId === 'custom') {
      const ids = topicsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedCount =
        countParam === 'all' || !countParam ? 'all' : Math.max(1, Number(countParam) || 30);
      return buildCustomQuizTopic(ids, parsedCount);
    }
    return getTopicById(topicId);
  }, [topicId, topicsParam, countParam]);

  // Load topic & check for saved progress
  useEffect(() => {
    setIsMounted(true);
    setIsLoading(true);
    const saved = getPublicQuizProgress(sessionKey);

    if (
      (topicId === 'random' || topicId === 'custom' || topicId === 'all') &&
      saved?.questionIds &&
      saved.questionIds.length > 0
    ) {
      const title =
        topicId === 'all'
          ? `All UIL-GET 311 Questions (${saved.questionIds.length})`
          : topicId === 'random'
            ? `Random Mix (${saved.questionIds.length} Questions)`
            : `Custom GET 311 Quiz (${saved.questionIds.length} Questions)`;
      setTopic(reconstructQuizTopic(topicId, title, saved.questionIds));
    } else {
      setTopic(buildFreshTopic());
    }

    if (saved && saved.userAnswers && Object.keys(saved.userAnswers).length > 0) {
      setSavedProgress({
        currentQuestion: saved.currentQuestionIndex + 1,
        answeredCount: Object.keys(saved.userAnswers).length,
        timestamp: saved.timestamp,
      });
      setShowResumeModal(true);
    }
    setIsLoading(false);
  }, [sessionKey, topicId, buildFreshTopic]);

  useEffect(() => {
    setMaxReachedIndex((prev) => Math.max(prev, currentQuestionIndex));
  }, [currentQuestionIndex]);

  const currentQuestion = topic?.questions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex] ?? null;
  const isCorrect = currentQuestion?.correctAnswer === selectedAnswer;
  const shuffledOptions = shuffledOptionsMap[currentQuestionIndex] ?? [];

  const answeredCount = Object.keys(userAnswers).length;
  const score = useMemo(() => {
    if (!topic) return 0;
    return Object.keys(userAnswers).reduce((acc, key) => {
      const idx = Number(key);
      return topic.questions[idx]?.correctAnswer === userAnswers[idx] ? acc + 1 : acc;
    }, 0);
  }, [topic, userAnswers]);

  const wrongCount = answeredCount - score;
  const skippedCount = topic ? Math.max(0, topic.questions.length - answeredCount) : 0;

  // Shuffle options for current question once
  useEffect(() => {
    if (topic && currentQuestion && !shuffledOptionsMap[currentQuestionIndex]) {
      setShuffledOptionsMap((prev) => ({
        ...prev,
        [currentQuestionIndex]: shuffleOptions(currentQuestion.options),
      }));
    }
  }, [topic, currentQuestion, currentQuestionIndex, shuffledOptionsMap]);

  // Persist progress
  useEffect(() => {
    if (isMounted && topic && Object.keys(userAnswers).length > 0 && !isComplete) {
      const dynamicIds =
        topicId === 'random' || topicId === 'custom' || topicId === 'all'
          ? topic.questions.map((q) => q.id)
          : undefined;
      savePublicQuizProgress(
        sessionKey,
        topicId,
        currentQuestionIndex,
        userAnswers,
        shuffledOptionsMap,
        dynamicIds
      );
    }
  }, [
    isMounted,
    topic,
    topicId,
    sessionKey,
    currentQuestionIndex,
    userAnswers,
    shuffledOptionsMap,
    isComplete,
  ]);

  // GSAP question transition
  useEffect(() => {
    if (questionRef.current) {
      gsap.fromTo(
        questionRef.current,
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [currentQuestionIndex]);

  // GSAP feedback panel
  useEffect(() => {
    if (selectedAnswer && feedbackRef.current) {
      gsap.fromTo(
        feedbackRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' }
      );
    }
  }, [selectedAnswer]);

  const handleContinueProgress = useCallback(() => {
    const saved = getPublicQuizProgress(sessionKey);
    if (saved) {
      setCurrentQuestionIndex(saved.currentQuestionIndex);
      setMaxReachedIndex(saved.currentQuestionIndex);
      setUserAnswers(saved.userAnswers);
      setShuffledOptionsMap(saved.shuffledOptionsMap);
    }
    setShowResumeModal(false);
  }, [sessionKey]);

  const handleStartFresh = useCallback(() => {
    clearPublicQuizProgress(sessionKey);
    setTopic(buildFreshTopic());
    setCurrentQuestionIndex(0);
    setMaxReachedIndex(0);
    setUserAnswers({});
    setShuffledOptionsMap({});
    setShowResumeModal(false);
  }, [sessionKey, buildFreshTopic]);

  const handleSelectAnswer = useCallback(
    (optionId: string) => {
      if (selectedAnswer !== null || isReviewing || !topic) return;
      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: optionId,
      }));
    },
    [selectedAnswer, isReviewing, topic, currentQuestionIndex]
  );

  const handleSubmitQuiz = useCallback(() => {
    setIsComplete(true);
    setIsReviewing(false);
    clearPublicQuizProgress(sessionKey);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [sessionKey]);

  const handleNext = useCallback(() => {
    if (!topic) return;
    if (currentQuestionIndex < topic.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  }, [topic, currentQuestionIndex, handleSubmitQuiz]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleJumpToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    setShowMobileMap(false);
  }, []);

  const handleRestart = useCallback(() => {
    clearPublicQuizProgress(sessionKey);
    setTopic(buildFreshTopic());
    setCurrentQuestionIndex(0);
    setMaxReachedIndex(0);
    setUserAnswers({});
    setShuffledOptionsMap({});
    setIsComplete(false);
    setIsReviewing(false);
  }, [sessionKey, buildFreshTopic]);

  const handleReview = useCallback(() => {
    setIsReviewing(true);
    setIsComplete(false);
    setCurrentQuestionIndex(0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (isComplete || showResumeModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key;
      const lower = key.toLowerCase();

      if (key === 'Enter' || lower === 'n') {
        e.preventDefault();
        handleNext();
        return;
      }
      if (key === 'Shift' || lower === 'p') {
        e.preventDefault();
        handlePrevious();
        return;
      }
      if (lower === 's') {
        e.preventDefault();
        handleNext();
        return;
      }
      if (!selectedAnswer && !isReviewing) {
        let idx = -1;
        if (key === '1' || lower === 'a') idx = 0;
        if (key === '2' || lower === 'b') idx = 1;
        if (key === '3' || lower === 'c') idx = 2;
        if (key === '4' || lower === 'd') idx = 3;
        if (idx !== -1 && shuffledOptions[idx]) {
          handleSelectAnswer(shuffledOptions[idx].id);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isComplete,
    showResumeModal,
    selectedAnswer,
    isReviewing,
    shuffledOptions,
    handleNext,
    handlePrevious,
    handleSelectAnswer,
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--brand-gold)]" />
          <p className="mt-3 text-sm font-semibold text-[var(--ink-700)]">Loading GET 311 Quiz…</p>
        </div>
      </div>
    );
  }

  if (!topic || !currentQuestion) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-page)] px-4 text-center">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">Quiz topic not found</h1>
        <p className="mt-2 text-sm text-[var(--ink-500)]">
          The topic you selected does not exist or has no questions.
        </p>
        <Link
          href={basePath}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-bold text-[var(--ink-900)] no-underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to UIL-GET 311 Topics
        </Link>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)]">
        <header className="border-b border-[var(--line)] bg-[var(--surface-card)] px-4 py-3.5 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight text-[var(--ink-900)] no-underline">
              Sabi<span className="text-[var(--brand-gold)]">Learn</span>
            </Link>
            <Link
              href={basePath}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-700)] no-underline hover:text-[var(--ink-900)]"
            >
              <ArrowLeft className="h-4 w-4" /> UIL-GET 311 Hub
            </Link>
          </div>
        </header>
        <QuizResults
          score={score}
          total={topic.questions.length}
          wrongCount={wrongCount}
          skippedCount={skippedCount}
          topicTitle={topic.title}
          recommendedCourse={recommendedCourse}
          basePath={basePath}
          onRestart={handleRestart}
          onReview={handleReview}
        />
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === topic.questions.length - 1;

  return (
    <div className="min-h-screen bg-[var(--surface-page)] pb-16">
      {showResumeModal && savedProgress && (
        <ResumeQuizModal
          topicTitle={topic.title}
          currentQuestion={savedProgress.currentQuestion}
          totalQuestions={topic.questions.length}
          answeredCount={savedProgress.answeredCount}
          timestamp={savedProgress.timestamp}
          onContinue={handleContinueProgress}
          onStartFresh={handleStartFresh}
        />
      )}

      {/* Compact Distraction-Free SabiLearn Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface-card)]/95 px-4 py-3 backdrop-blur-xs sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={basePath}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-1.5 text-xs font-bold text-[var(--ink-900)] no-underline transition-colors hover:border-[var(--ink-900)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Topics
            </Link>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[var(--ink-500)]">
                Sabi<span className="text-[var(--brand-gold-600)]">Learn</span> · UIL-GET 311
              </p>
              <h1 className="truncate text-sm font-bold text-[var(--ink-900)] sm:text-base">
                {topic.title}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMobileMap((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--ink-900)] lg:hidden"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Map
            </button>
            <button
              type="button"
              onClick={handleSubmitQuiz}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[var(--ink-900)] bg-[var(--brand-gold)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--brand-gold-600)]"
            >
              <Flag className="h-3.5 w-3.5" /> Submit
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        {showMobileMap && isMounted && (
          <div className="mb-6 lg:hidden">
            <QuizOverview
              questions={topic.questions}
              userAnswers={userAnswers}
              currentQuestionIndex={currentQuestionIndex}
              maxReachedIndex={maxReachedIndex}
              onQuestionClick={handleJumpToQuestion}
            />
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Main Quiz Column */}
          <main className="min-w-0 flex-1">
            {isReviewing && (
              <div className="mb-4 flex items-center justify-between rounded-xl border-2 border-[var(--brand-violet)] bg-[var(--brand-violet-100)] px-4 py-2.5 text-xs font-bold text-[var(--brand-violet)]">
                <span>Review Mode — browsing answers & explanations</span>
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="rounded-lg bg-[var(--brand-violet)] px-3 py-1 text-white"
                >
                  Back to Results
                </button>
              </div>
            )}

            <QuizProgress
              current={currentQuestionIndex + 1}
              total={topic.questions.length}
              score={score}
              answeredCount={answeredCount}
            />

            {/* Question Card */}
            <div
              ref={questionRef}
              className="mb-5 rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] p-6 shadow-[0_4px_0_#0E0E1A]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full bg-[var(--surface-sunken)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                  Question {currentQuestionIndex + 1}
                </span>
                {currentQuestion.difficulty === 'calculation' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-violet-100)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--brand-violet)]">
                    <Calculator className="h-3 w-3" /> Calculation
                  </span>
                )}
              </div>

              <div className="text-lg font-bold leading-relaxed text-[var(--ink-900)] sm:text-xl">
                <RichText text={currentQuestion.question} />
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {isMounted &&
                shuffledOptions.map((option, index) => (
                  <OptionCard
                    key={`${currentQuestion.id}-${option.id}`}
                    option={option}
                    index={index}
                    isSelected={selectedAnswer === option.id}
                    isCorrect={isCorrect}
                    showResult={selectedAnswer !== null || isReviewing}
                    correctAnswerId={currentQuestion.correctAnswer}
                    onSelect={handleSelectAnswer}
                    disabled={selectedAnswer !== null || isReviewing}
                  />
                ))}
            </div>

            {/* Navigation Row */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[var(--ink-900)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--surface-sunken)] disabled:invisible"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>

              {!selectedAnswer && !isReviewing && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-sunken)] px-4 py-2.5 text-sm font-bold text-[var(--ink-700)] transition-colors hover:border-[var(--ink-900)] hover:text-[var(--ink-900)]"
                >
                  {isLastQuestion ? 'Submit & See Results' : 'Skip Question'}
                  <SkipForward className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Instant Feedback & LaTeX Explanation Panel */}
            {(selectedAnswer || isReviewing) && (
              <div
                ref={feedbackRef}
                className={`mt-5 rounded-2xl border-2 p-5 shadow-[var(--shadow-sm)] ${
                  isCorrect
                    ? 'border-[#10B981] bg-emerald-50/90'
                    : 'border-[#E5484D] bg-red-50/90'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                  ) : (
                    <XCircle className="h-5 w-5 text-[#E5484D]" />
                  )}
                  <span
                    className={`text-base font-extrabold ${
                      isCorrect ? 'text-emerald-900' : 'text-red-900'
                    }`}
                  >
                    {isCorrect ? 'Correct!' : selectedAnswer ? 'Incorrect' : 'Skipped'}
                  </span>
                </div>

                {currentQuestion.explanation && (
                  <div className="mt-3 rounded-xl border border-[var(--line)] bg-white/90 p-4 text-sm leading-relaxed text-[var(--ink-900)]">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
                      Explanation
                    </div>
                    <RichText text={currentQuestion.explanation} />
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-bold text-[var(--ink-900)] shadow-[0_3px_0_#0E0E1A] transition-all hover:bg-[var(--brand-gold-600)]"
                  >
                    {isLastQuestion
                      ? isReviewing
                        ? 'Back to Results'
                        : 'Submit & See Results'
                      : 'Next Question'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Desktop Overview Sidebar */}
          {isMounted && (
            <div className="hidden lg:block">
              <QuizOverview
                questions={topic.questions}
                userAnswers={userAnswers}
                currentQuestionIndex={currentQuestionIndex}
                maxReachedIndex={maxReachedIndex}
                onQuestionClick={handleJumpToQuestion}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
