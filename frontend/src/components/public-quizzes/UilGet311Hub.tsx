'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Calculator,
  Check,
  GraduationCap,
  Play,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { ALL_UIL_GET311_QUESTIONS, UIL_GET311_TOPICS } from '@/data/public-quizzes/uil-get311';
import { clearPublicQuizProgress } from '@/utils/publicQuizStorage';
import TopicCard from './TopicCard';
import RandomQuizModal from './RandomQuizModal';

const COUNT_OPTIONS = [15, 30, 50, 100];
const BASE_PATH = '/public-quizzes/uil-get311';

export default function UilGet311Hub() {
  const router = useRouter();
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(() =>
    UIL_GET311_TOPICS.map((t) => t.id)
  );
  const [questionCount, setQuestionCount] = useState<number | 'all'>(30);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);

  const totalQuestions = ALL_UIL_GET311_QUESTIONS.length;
  const totalCalculations = useMemo(
    () => ALL_UIL_GET311_QUESTIONS.filter((q) => q.difficulty === 'calculation').length,
    []
  );

  const availableInSelection = useMemo(() => {
    const selectedSet = new Set(selectedTopicIds);
    return UIL_GET311_TOPICS.reduce(
      (sum, t) => (selectedSet.has(t.id) ? sum + t.questions.length : sum),
      0
    );
  }, [selectedTopicIds]);

  const effectiveCount =
    questionCount === 'all'
      ? availableInSelection
      : Math.min(questionCount, availableInSelection);

  const allSelected = selectedTopicIds.length === UIL_GET311_TOPICS.length;

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllTopics = () => {
    setSelectedTopicIds(allSelected ? [] : UIL_GET311_TOPICS.map((t) => t.id));
  };

  const handleStartCustom = () => {
    if (selectedTopicIds.length === 0 || effectiveCount === 0) return;
    if (allSelected && questionCount === 'all') {
      clearPublicQuizProgress('all');
      router.push(`${BASE_PATH}/all`);
      return;
    }
    const topicsParam = selectedTopicIds.join(',');
    const countParam = questionCount === 'all' ? 'all' : String(effectiveCount);
    const sessionKey = `custom_${topicsParam}_${countParam}`;
    clearPublicQuizProgress(sessionKey);
    router.push(
      `${BASE_PATH}/custom?topics=${encodeURIComponent(topicsParam)}&count=${encodeURIComponent(countParam)}`
    );
  };

  return (
    <main className="min-h-screen bg-[var(--surface-page)] pb-24">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
        {/* Hero Header */}
        <section className="rounded-3xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] p-6 shadow-[0_6px_0_#0E0E1A] sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-gold-100)] px-3.5 py-1 text-xs font-bold text-[var(--ink-900)]">
              <GraduationCap className="h-3.5 w-3.5" /> University of Ilorin · 300L Engineering
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-violet-100)] px-3.5 py-1 text-xs font-bold text-[var(--brand-violet)]">
              <Sparkles className="h-3.5 w-3.5" /> Free Public Practice Quiz
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--ink-900)] sm:text-5xl">
            UIL-GET 311: Engineering Economics
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--ink-700)] sm:text-lg">
            Practice <strong>{totalQuestions} exam-style MCQs</strong> drawn directly from the UIL-GET 311 lecture notes, Depreciation slides, and class calculations — complete with instant feedback and step-by-step LaTeX explanations.
          </p>

          {/* Quick Stats */}
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-[var(--ink-700)]">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-1.5">
              <BookOpen className="h-3.5 w-3.5 text-[var(--ink-900)]" /> {UIL_GET311_TOPICS.length} Topics
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-1.5">
              <Calculator className="h-3.5 w-3.5 text-[var(--brand-violet)]" /> {totalCalculations} Worked Calculations
            </span>
          </div>

          {/* One-Click Quick Start Actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`${BASE_PATH}/all`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--brand-gold)] px-5 py-3 text-sm font-bold text-[var(--ink-900)] shadow-[0_3px_0_#0E0E1A] no-underline transition-all hover:bg-[var(--brand-gold-600)]"
            >
              <Play className="h-4 w-4 fill-current" /> Attempt All {totalQuestions} Questions
            </Link>

            <button
              type="button"
              onClick={() => setShowCustomBuilder((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] px-5 py-3 text-sm font-bold transition-colors ${
                showCustomBuilder
                  ? 'bg-[var(--brand-violet)] text-white'
                  : 'bg-white text-[var(--ink-900)] hover:bg-[var(--surface-sunken)]'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showCustomBuilder ? 'Hide Custom Filter' : 'Filter Topics & Count'}
            </button>

            <button
              type="button"
              onClick={() => setShowRandomModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--surface-sunken)] px-5 py-3 text-sm font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--line)]"
            >
              <Shuffle className="h-4 w-4" /> Quick Random Mix
            </button>
          </div>

          {/* Custom Quiz Filter Panel */}
          {showCustomBuilder && (
            <div className="mt-6 rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--surface-page)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--ink-900)]">
                  1. Pick Topics ({selectedTopicIds.length}/{UIL_GET311_TOPICS.length})
                </h2>
                <button
                  type="button"
                  onClick={toggleAllTopics}
                  className="text-xs font-bold text-[var(--brand-violet)] underline-offset-2 hover:underline"
                >
                  {allSelected ? 'Clear all' : 'Select all topics'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {UIL_GET311_TOPICS.map((topic) => {
                  const isSelected = selectedTopicIds.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopic(topic.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition-all ${
                        isSelected
                          ? 'border-[var(--ink-900)] bg-[var(--brand-gold-100)] text-[var(--ink-900)]'
                          : 'border-[var(--line)] bg-white text-[var(--ink-500)] hover:border-[var(--ink-900)]'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      <span>{topic.shortTitle}</span>
                      <span className="opacity-70">({topic.questions.length})</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <h2 className="text-base font-bold text-[var(--ink-900)]">
                  2. How many questions?
                </h2>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={availableInSelection === 0}
                      onClick={() => setQuestionCount(n)}
                      className={`rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all disabled:opacity-40 ${
                        questionCount === n
                          ? 'border-[var(--ink-900)] bg-[var(--brand-gold)] text-[var(--ink-900)]'
                          : 'border-[var(--line)] bg-white text-[var(--ink-700)] hover:border-[var(--ink-900)]'
                      }`}
                    >
                      {n} Questions
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={availableInSelection === 0}
                    onClick={() => setQuestionCount('all')}
                    className={`rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all disabled:opacity-40 ${
                      questionCount === 'all'
                        ? 'border-[var(--ink-900)] bg-[var(--brand-violet)] text-white'
                        : 'border-[var(--line)] bg-white text-[var(--ink-700)] hover:border-[var(--ink-900)]'
                    }`}
                  >
                    All Selected ({availableInSelection})
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                <p className="text-xs font-medium text-[var(--ink-500)]">
                  {availableInSelection === 0
                    ? 'Select at least one topic to start.'
                    : `Ready to start ${effectiveCount} shuffled question${effectiveCount === 1 ? '' : 's'} from ${selectedTopicIds.length} topic${selectedTopicIds.length === 1 ? '' : 's'}.`}
                </p>
                <button
                  type="button"
                  disabled={availableInSelection === 0}
                  onClick={handleStartCustom}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink-900)] bg-[var(--brand-violet)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_#0E0E1A] transition-all hover:bg-[var(--brand-violet-600)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4 fill-current" /> Start Custom Quiz ({effectiveCount})
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Topic Cards Grid */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-[var(--ink-900)]">Practice by Topic</h2>
              <p className="mt-1 text-sm text-[var(--ink-500)]">
                Pick any topic below to focus on specific lecture areas, or use the filter above to combine topics.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {UIL_GET311_TOPICS.map((topic, index) => (
              <TopicCard key={topic.id} topic={topic} index={index} basePath={BASE_PATH} />
            ))}
          </div>
        </section>
      </div>

      {/* Floating Random Mix FAB (from quiz-platform-main) */}
      <button
        type="button"
        onClick={() => setShowRandomModal(true)}
        aria-label="Start Random Quiz"
        title="Start Random Mix Quiz"
        className="fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--ink-900)] bg-[var(--brand-gold)] text-[var(--ink-900)] shadow-[0_4px_0_#0E0E1A] transition-transform hover:scale-105 hover:bg-[var(--brand-gold-600)]"
      >
        <Shuffle className="h-6 w-6" />
      </button>

      {showRandomModal && (
        <RandomQuizModal
          totalAvailable={totalQuestions}
          basePath={BASE_PATH}
          onClose={() => setShowRandomModal(false)}
        />
      )}
    </main>
  );
}
