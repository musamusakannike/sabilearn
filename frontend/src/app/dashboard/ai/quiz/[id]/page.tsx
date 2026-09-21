'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { aiApi } from '@/lib/api';
import { AiHistoryItem, AiQuizQuestion } from '@/lib/types';
import Button from '@/components/ui/Button';
import { RichText } from '@/components/lesson/RichText';

export default function AIQuizAttemptPage() {
  const params = useParams();
  const historyId = params.id as string;

  const [quizItem, setQuizItem] = useState<AiHistoryItem | null>(null);
  const [questions, setQuestions] = useState<AiQuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    if (!historyId) return;

    (async () => {
      try {
        const res = await aiApi.getHistoryById(historyId);
        if (!active) return;

        if (res.data?.success && res.data?.data) {
          const item = res.data.data;
          setQuizItem(item);

          let parsedQuestions: AiQuizQuestion[] = [];
          if (Array.isArray(item.result)) {
            parsedQuestions = item.result;
          } else if (typeof item.result === 'string') {
            try {
              const clean = item.result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsedQuestions = JSON.parse(clean);
            } catch {
              parsedQuestions = [];
            }
          }

          if (parsedQuestions.length > 0) {
            setQuestions(parsedQuestions);
          } else {
            setError('No valid questions found for this quiz.');
          }
        } else {
          setError('Quiz not found.');
        }
      } catch (err: unknown) {
        if (!active) return;
        const errorObj = err as { response?: { data?: { message?: string } } };
        setError(errorObj?.response?.data?.message || 'Failed to load quiz details.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [historyId]);

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
  };

  // Calculate score
  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const selectedOptIdx = selectedAnswers[idx];
      if (selectedOptIdx !== undefined && q.options[selectedOptIdx]?.isCorrect) {
        correctCount++;
      }
    });
    return {
      correctCount,
      total: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100),
    };
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-16 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-[var(--brand-violet)]" />
        <p className="text-sm font-medium text-[var(--ink-500)]">Loading AI Quiz...</p>
      </div>
    );
  }

  if (error || !quizItem || questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--danger-100)] text-[var(--danger)]">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-[var(--ink-900)]">Quiz Error</h2>
        <p className="text-sm text-[var(--ink-500)]">{error || 'Could not load questions.'}</p>
        <Link
          href="/dashboard/ai/quiz"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-violet)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-violet-600)]"
        >
          <ArrowLeft className="size-4" />
          Back to AI Quiz Hub
        </Link>
      </div>
    );
  }

  const scoreInfo = calculateScore();
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === questions.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/ai/quiz"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-500)] transition-colors hover:text-[var(--brand-violet)]"
        >
          <ArrowLeft className="size-4" />
          Back to Quiz Hub
        </Link>

        <span className="rounded-full bg-[var(--brand-violet-100)] px-3 py-1 text-xs font-semibold tracking-wider text-[var(--brand-violet-600)] uppercase">
          Topic: {quizItem.prompt || 'Custom Topic'}
        </span>
      </div>

      {/* Quiz Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-xs)]">
        <div>
          <h1 className="text-2xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">
            {quizItem.title}
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-500)]">
            {questions.length} Multiple Choice Questions
          </p>
        </div>

        {isSubmitted && (
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-sunken)] px-4 py-2">
            <Award className="size-6 text-[var(--brand-gold)]" />
            <div>
              <div className="text-xs font-semibold text-[var(--ink-500)] uppercase">Score</div>
              <div className="text-lg font-bold text-[var(--ink-900)]">
                {scoreInfo.correctCount} / {scoreInfo.total} ({scoreInfo.percentage}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Mode: Active Attempt runner vs Detailed Review */}
      {!isSubmitted ? (
        <div className="space-y-6">
          {/* Stepper Progress Bar */}
          <div className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-card)] p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-500)]">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{answeredCount} of {questions.length} Answered</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
              <div
                className="h-full bg-[var(--brand-violet)] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="space-y-6 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-xs)] sm:p-8">
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider text-[var(--brand-violet)] uppercase">
                Question {currentIndex + 1}
              </span>
              <h2 className="text-lg leading-snug font-bold text-[var(--ink-900)] sm:text-xl">
                <RichText text={currentQuestion.question} />
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[currentIndex] === oIdx;
                const optionLabel = String.fromCharCode(65 + oIdx); // A, B, C, D

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentIndex, oIdx)}
                    className={`flex w-full items-center gap-4 rounded-[var(--radius-lg)] border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[var(--brand-violet)] bg-[var(--brand-violet-100)] text-[var(--brand-violet-600)] shadow-xs'
                        : 'border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-900)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-sunken)]'
                    }`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-[var(--brand-violet)] text-white'
                          : 'bg-[var(--surface-sunken)] text-[var(--ink-700)]'
                      }`}
                    >
                      {optionLabel}
                    </span>
                    <span className="text-sm leading-normal font-medium"><RichText text={opt.text} /></span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`inline-flex items-center gap-1 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-colors ${
                currentIndex === 0
                  ? 'cursor-not-allowed text-[var(--ink-300)] opacity-40'
                  : 'border border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-700)] hover:bg-[var(--surface-sunken)]'
              }`}
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>

            <div className="flex items-center gap-3">
              {currentIndex < questions.length - 1 ? (
                <Button variant="ai" onClick={handleNext}>
                  Next Question
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!isAllAnswered}
                  title={!isAllAnswered ? 'Please answer all questions before submitting' : undefined}
                >
                  <CheckCircle2 className="mr-1.5 size-4" />
                  Submit Quiz
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Review Mode: Detailed Results & Explanations */
        <div className="space-y-8">
          {/* Summary Banner */}
          <div className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] p-6 text-center shadow-[var(--shadow-sm)] sm:p-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--brand-violet-100)] text-[var(--brand-violet)]">
              <Award className="size-8 text-[var(--brand-gold)]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">
                Quiz Completed!
              </h2>
              <p className="text-sm text-[var(--ink-500)]">
                You scored <strong className="text-[var(--ink-900)]">{scoreInfo.correctCount}</strong> out of{' '}
                <strong className="text-[var(--ink-900)]">{scoreInfo.total}</strong> ({scoreInfo.percentage}%)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRetake}
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-900)] transition-colors hover:bg-[var(--line)]"
              >
                <RotateCcw className="size-4" />
                Retake Quiz
              </button>
              <Link
                href="/dashboard/ai/quiz"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-violet)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-violet-600)]"
              >
                <Brain className="size-4" />
                Return to Quiz Hub
              </Link>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[var(--ink-900)]">Detailed Answer Explanations</h3>

            {questions.map((q, qIdx) => {
              const selectedOptIdx = selectedAnswers[qIdx];
              const correctOptIdx = q.options.findIndex((o) => o.isCorrect);
              const isCorrect = selectedOptIdx === correctOptIdx;

              return (
                <div
                  key={qIdx}
                  className={`space-y-4 rounded-[var(--radius-xl)] border bg-[var(--surface-card)] p-6 shadow-[var(--shadow-xs)] ${
                    isCorrect ? 'border-[var(--success)]/40' : 'border-[var(--danger)]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--ink-500)] uppercase">
                          Question {qIdx + 1}
                        </span>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 rounded-full bg-[var(--success-100)] px-2 py-0.5 text-xs font-bold text-[var(--success)]">
                            <CheckCircle2 className="size-3" /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-[var(--danger-100)] px-2 py-0.5 text-xs font-bold text-[var(--danger)]">
                            <XCircle className="size-3" /> Incorrect
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-[var(--ink-900)]"><RichText text={q.question} /></h4>
                    </div>
                  </div>

                  {/* Options with Review Highlighting */}
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const isOptionSelected = selectedOptIdx === oIdx;
                      const isOptionCorrect = opt.isCorrect;

                      let styleClasses = 'bg-[var(--surface-card)] border-[var(--line)] text-[var(--ink-700)]';
                      if (isOptionCorrect) {
                        styleClasses = 'bg-[var(--success-100)] border-[var(--success)] text-[var(--success)] font-semibold';
                      } else if (isOptionSelected && !isOptionCorrect) {
                        styleClasses = 'bg-[var(--danger-100)] border-[var(--danger)] text-[var(--danger)] font-semibold';
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`flex items-center justify-between rounded-[var(--radius-md)] border p-3.5 text-sm ${styleClasses}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/60 text-xs font-bold">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span><RichText text={opt.text} /></span>
                          </div>
                          {isOptionCorrect && <CheckCircle2 className="size-4 shrink-0 text-[var(--success)]" />}
                          {isOptionSelected && !isOptionCorrect && <XCircle className="size-4 shrink-0 text-[var(--danger)]" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  {q.explanation && (
                    <div className="space-y-1 rounded-[var(--radius-md)] border border-[var(--brand-violet)]/20 bg-[var(--brand-violet-100)] p-4 text-xs text-[var(--ink-900)] sm:text-sm">
                      <span className="block font-bold text-[var(--brand-violet-600)]">💡 Explanation</span>
                      <p className="leading-relaxed text-[var(--ink-700)]"><RichText text={q.explanation} /></p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
