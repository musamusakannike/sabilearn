'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X, RotateCcw, ChevronDown } from 'lucide-react';
import { mcqApi, topicApi } from '@/lib/api';
import { MCQ, Topic } from '@/lib/types';
import { useProgressStore } from '@/store/progress.store';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { RichText } from '@/components/lesson/RichText';

type Phase = 'setup' | 'quiz' | 'results';

export default function McqPage() {
  const params = useParams();
  const courseId = params.id as string;
  const topicId = params.topicId as string;
  const { submitMcqSession } = useProgressStore();

  const [allMcqs, setAllMcqs] = useState<MCQ[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questionCount, setQuestionCount] = useState(10);
  const [activeMcqs, setActiveMcqs] = useState<MCQ[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<{ mcqId: string; correct: boolean; selected: number }[]>([]);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [quizDuration, setQuizDuration] = useState<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const [mcqRes, topicRes] = await Promise.all([mcqApi.byTopic(topicId), topicApi.get(topicId)]);
        setAllMcqs(mcqRes.data.data || []);
        setTopic(topicRes.data.data);
      } catch (e: any) {
        if (e.response?.status === 403) {
          window.location.href = `/dashboard/courses/${courseId}?paywall=true`;
        } else {
          console.error(e);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [topicId, courseId]);

  const startQuiz = (count: number) => {
    const shuffled = [...allMcqs].sort(() => Math.random() - 0.5);
    setActiveMcqs(count === 0 ? shuffled : shuffled.slice(0, Math.min(count, shuffled.length)));
    setPhase('quiz'); setCurrentQ(0); setSelectedOption(null); setShowFeedback(false); setAnswers([]);
    startTimeRef.current = Date.now();
  };

  const handleSelectOption = (idx: number) => {
    if (showFeedback) return;
    setSelectedOption(idx);
    setShowFeedback(true);
    const correct = activeMcqs[currentQ].options[idx].isCorrect;
    setAnswers([...answers, { mcqId: activeMcqs[currentQ]._id, correct, selected: idx }]);
  };

  const handleNext = () => {
    if (currentQ < activeMcqs.length - 1) {
      setCurrentQ(currentQ + 1); setSelectedOption(null); setShowFeedback(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    setQuizDuration(duration);
    const correctCount = answers.filter((a) => a.correct).length;
    const score = Math.round((correctCount / activeMcqs.length) * 100);
    await submitMcqSession({ course: courseId, topic: topicId, mcqAnswered: activeMcqs.length, mcqCorrect: correctCount, score, duration });
    setPhase('results');
  };

  const retry = () => { setPhase('setup'); setCurrentQ(0); setSelectedOption(null); setShowFeedback(false); setAnswers([]); };

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;

  if (allMcqs.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-[var(--text-muted)]">No MCQs available for this topic yet.</p>
        <Link href={`/dashboard/courses/${courseId}/topics/${topicId}`} className="text-[var(--brand-gold-600)] hover:opacity-80">Back to topic</Link>
      </div>
    );
  }

  if (phase === 'setup') {
    const countOptions = [5, 10, 15, 20];
    return (
      <div className="mx-auto max-w-2xl">
        <Link href={`/dashboard/courses/${courseId}/topics/${topicId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--ink-900)]">
          <ArrowLeft className="size-4" /> Back to topic
        </Link>
        <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-[var(--ink-900)]">Ready to test your knowledge?</h1>
          <p className="mb-1 text-[var(--text-muted)]">Select the number of questions</p>
          <p className="mb-6 text-sm text-[var(--ink-300)]">{allMcqs.length} questions available</p>
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
            {countOptions.map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                disabled={count > allMcqs.length}
                className={`cursor-pointer rounded-[var(--radius-md)] border py-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-40 ${
                  questionCount === count ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[var(--ink-900)]' : 'border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--line-strong)]'
                }`}
              >
                {count}
              </button>
            ))}
            <button
              onClick={() => setQuestionCount(0)}
              className={`cursor-pointer rounded-[var(--radius-md)] border py-4 text-sm font-semibold ${
                questionCount === 0 ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[var(--ink-900)]' : 'border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--line-strong)]'
              }`}
            >
              All
            </button>
          </div>
          <Button onClick={() => startQuiz(questionCount)} fullWidth>Start quiz</Button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const mcq = activeMcqs[currentQ];
    const progress = ((currentQ + 1) / activeMcqs.length) * 100;
    return (
      <div className="mx-auto max-w-2xl">
        {topic && <p className="mb-4 text-xs font-semibold tracking-wide text-[var(--brand-gold-600)] uppercase">{topic.title}</p>}
        <div className="mb-4">
          <ProgressBar value={progress} label={`Question ${currentQ + 1} of ${activeMcqs.length}`} />
        </div>
        <div className="mb-4 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] p-6">
          <p className="mb-6 text-lg font-medium text-[var(--ink-900)]"><RichText text={mcq.question} /></p>
          <div className="space-y-2">
            {mcq.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = option.isCorrect;
              let cls = 'border-[var(--line)] text-[var(--ink-900)] hover:border-[var(--line-strong)]';
              if (showFeedback) {
                if (isCorrect) cls = 'border-[var(--success)] bg-[var(--success-100)] text-[var(--success)]';
                else if (isSelected && !isCorrect) cls = 'border-[var(--danger)] bg-[var(--danger-100)] text-[var(--danger)]';
                else cls = 'border-[var(--line)] text-[var(--text-muted)]';
              } else if (isSelected) {
                cls = 'border-[var(--brand-gold)] bg-[var(--brand-gold-100)] text-[var(--ink-900)]';
              }
              return (
                <button key={idx} onClick={() => handleSelectOption(idx)} disabled={showFeedback} className={`w-full rounded-[var(--radius-md)] border p-4 text-left transition-all ${cls} ${!showFeedback ? 'cursor-pointer' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm"><RichText text={option.text} /></span>
                    {showFeedback && isCorrect && <Check className="size-4 text-[var(--success)]" />}
                    {showFeedback && isSelected && !isCorrect && <X className="size-4 text-[var(--danger)]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showFeedback && (
          <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-4">
            <p className="mb-1 text-xs text-[var(--text-muted)]">Explanation</p>
            <p className="text-sm text-[var(--ink-900)]"><RichText text={mcq.explanation || 'No explanation provided.'} /></p>
          </div>
        )}

        {showFeedback && (
          <Button onClick={handleNext} fullWidth>{currentQ < activeMcqs.length - 1 ? 'Next question' : 'Finish quiz'}</Button>
        )}
      </div>
    );
  }

  const correctCount = answers.filter((a) => a.correct).length;
  const score = Math.round((correctCount / activeMcqs.length) * 100);
  const duration = quizDuration;
  const tone = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center">
        <h1 className="mb-6 text-2xl font-bold text-[var(--ink-900)]">Quiz results</h1>
        <div className="relative mx-auto mb-6 flex size-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(${tone} ${score}%, var(--surface-sunken) 0)` }}>
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[var(--surface-card)]">
            <span className="text-4xl font-bold" style={{ color: tone }}>{score}%</span>
            <span className="mt-1 text-xs text-[var(--ink-300)]">Score</span>
          </div>
        </div>
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-4">
            <p className="text-xl font-bold text-[var(--ink-900)]">{correctCount}/{activeMcqs.length}</p>
            <p className="mt-1 text-xs text-[var(--ink-300)]">Correct</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-4">
            <p className="text-xl font-bold text-[var(--ink-900)]">{Math.floor(duration / 60)}m {duration % 60}s</p>
            <p className="mt-1 text-xs text-[var(--ink-300)]">Time</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-4">
            <p className="text-xl font-bold text-[var(--ink-900)]">{score}%</p>
            <p className="mt-1 text-xs text-[var(--ink-300)]">Accuracy</p>
          </div>
        </div>
        <p className="mb-6 text-sm" style={{ color: tone }}>
          {score >= 80 ? "Excellent work — you're mastering this topic." : score >= 50 ? 'Good effort. Keep practicing to improve.' : "Don't give up — review the material and try again."}
        </p>
        <div className="mb-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={retry}><RotateCcw className="size-4" /> Retry</Button>
          <Link href={`/dashboard/courses/${courseId}/topics/${topicId}`}><Button>Back to topic</Button></Link>
        </div>
        <div className="text-left">
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink-900)]">Review answers</h2>
          <div className="space-y-2">
            {activeMcqs.map((mcq, i) => {
              const answer = answers[i];
              const isExpanded = expandedReview === i;
              return (
                <div key={mcq._id} className="overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-sunken)]">
                  <button onClick={() => setExpandedReview(isExpanded ? null : i)} className="flex w-full cursor-pointer items-center justify-between p-3 text-left">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${answer?.correct ? 'bg-[var(--success-100)]' : 'bg-[var(--danger-100)]'}`}>
                        {answer?.correct ? <Check className="size-3 text-[var(--success)]" /> : <X className="size-3 text-[var(--danger)]" />}
                      </span>
                      <span className="truncate text-sm text-[var(--ink-900)]">{mcq.question}</span>
                    </div>
                    <ChevronDown className={`size-4 shrink-0 text-[var(--ink-300)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="space-y-1 px-3 pb-3 pl-10">
                      {mcq.options.map((opt, idx) => (
                        <div key={idx} className={`rounded px-2 py-1.5 text-xs ${opt.isCorrect ? 'bg-[var(--success-100)] text-[var(--success)]' : idx === answer?.selected ? 'bg-[var(--danger-100)] text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
                          {opt.text} {opt.isCorrect && '(correct)'}
                        </div>
                      ))}
                      {mcq.explanation && <p className="pt-1 text-xs text-[var(--text-muted)]">{mcq.explanation}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
