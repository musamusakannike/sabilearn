import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCards,
  IconCheck,
  IconChevronLeft,
  IconListCheck,
  IconListTree,
  IconSparkles,
  IconTrophy,
} from '@tabler/icons-react';
import { Badge, Button, Card, EmptyState, Kbd, Skeleton } from '@/components/ui';
import { chapterApi, topicApi } from '@/lib/api';
import {
  cacheTopicDetail,
  getCachedPaymentStatus,
  getLocalCourseProgress,
  isOnline,
} from '@/lib/offlineSync';
import {
  checkOfflineCourseAccess,
  computeChaptersWithStatus,
  getOfflineChapters,
  getOfflineCourseDetail,
  getOfflineTopicById,
  getOfflineTopics,
} from '@/lib/offlineCourses';
import { Chapter, Topic, TopicContent } from '@/lib/types';
import { useAuthStore } from '@/stores/auth.store';
import { useProgressStore } from '@/stores/progress.store';
import { LessonContentBlock } from './RichContent';
import { QuizStep } from './QuizStep';
import { ExerciseRunner } from './ExerciseRunner';
import { InLessonAiTutor } from './InLessonAiTutor';

export interface StepPlayerProps {
  topic: Topic;
  onComplete: () => Promise<{ earnedXp: number; isCourseComplete: boolean }>;
  onSavePosition: (index: number) => void;
  initialIndex?: number;
  onNextTopic?: () => void;
  onBackToCourse: () => void;
  onToggleTutor: () => void;
  tutorOpen: boolean;
  onStepChange?: (step: TopicContent | undefined) => void;
}

export function StepPlayer({
  topic,
  onComplete,
  onSavePosition,
  initialIndex = 0,
  onNextTopic,
  onBackToCourse,
  onToggleTutor,
  tutorOpen,
  onStepChange,
}: StepPlayerProps) {
  const steps = useMemo(() => topic.contents || [], [topic.contents]);
  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(0, steps.length - 1)));
  const [answeredQuizzes, setAnsweredQuizzes] = useState<Record<number, boolean>>({});
  const [completing, setCompleting] = useState(false);
  const [completedInfo, setCompletedInfo] = useState<{
    earnedXp: number;
    isCourseComplete: boolean;
  } | null>(null);

  const currentStep = steps[index];

  useEffect(() => {
    setIndex(Math.min(initialIndex, Math.max(0, steps.length - 1)));
    setAnsweredQuizzes({});
    setCompletedInfo(null);
  }, [topic._id, initialIndex, steps.length]);

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const isQuizLocked = currentStep?.type === 'quiz' && !answeredQuizzes[index];
  const isLastStep = index >= steps.length - 1;

  const fireConfetti = () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    try {
      void confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore in jsdom
    }
  };

  const handleNext = useCallback(async () => {
    if (isQuizLocked || completing || completedInfo) return;
    if (!isLastStep) {
      const next = index + 1;
      setIndex(next);
      onSavePosition(next);
      return;
    }
    setCompleting(true);
    try {
      const res = await onComplete();
      setCompletedInfo(res);
      fireConfetti();
    } finally {
      setCompleting(false);
    }
  }, [isQuizLocked, completing, completedInfo, isLastStep, index, onSavePosition, onComplete]);

  const handlePrev = useCallback(() => {
    if (index > 0 && !completedInfo) {
      const prev = index - 1;
      setIndex(prev);
      onSavePosition(prev);
    }
  }, [index, completedInfo, onSavePosition]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        onToggleTutor();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        void handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Enter' && currentStep?.type !== 'quiz') {
        e.preventDefault();
        void handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNext, handlePrev, onToggleTutor, currentStep?.type]);

  if (completedInfo) {
    return (
      <div className="max-w-[540px] mx-auto py-16 px-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center mx-auto">
          {completedInfo.isCourseComplete ? <IconTrophy size={34} /> : <IconCheck size={34} />}
        </div>
        <div>
          <Badge variant="gold">+{completedInfo.earnedXp || topic.xp || 50} XP Earned</Badge>
          <h2 className="text-[26px] font-bold mt-3">
            {completedInfo.isCourseComplete ? 'Course Complete!' : 'Lesson Complete!'}
          </h2>
          <p className="text-[14px] text-[var(--text-tertiary)] mt-1">
            You finished <strong>{topic.title}</strong>. Keep the momentum going!
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="secondary" onClick={onBackToCourse}>
            Back to Course
          </Button>
          {onNextTopic && (
            <Button onClick={onNextTopic} icon={<IconArrowRight size={16} />}>
              Next Lesson
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="max-w-[560px] mx-auto py-12 px-6">
        <EmptyState
          mascot
          title="No steps in this lesson yet"
          description="This lesson has no content blocks available right now."
          action={<Button onClick={onBackToCourse}>Back to Course</Button>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Segmented Step Progress Bar */}
      <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/70 flex items-center gap-4 shrink-0">
        <div className="flex-1 flex items-center gap-1.5" aria-label={`Step ${index + 1} of ${steps.length}`}>
          {steps.map((s, idx) => (
            <button
              key={s._id || idx}
              type="button"
              onClick={() => idx <= index && setIndex(idx)}
              aria-label={`Go to step ${idx + 1}`}
              className="h-2 rounded-full transition-all duration-200 cursor-pointer"
              style={{
                flex: idx === index ? 2.2 : 1,
                backgroundColor:
                  idx < index
                    ? 'var(--success)'
                    : idx === index
                      ? 'var(--brand-primary)'
                      : 'var(--border-default)',
              }}
            />
          ))}
        </div>
        <span className="text-[12px] font-semibold text-[var(--text-tertiary)] shrink-0">
          {index + 1} / {steps.length}
        </span>
        <Button
          size="sm"
          variant={tutorOpen ? 'ai' : 'secondary'}
          icon={<IconSparkles size={14} />}
          onClick={onToggleTutor}
        >
          AI Tutor
        </Button>
      </div>

      {/* Centered 720px Reading Body */}
      <div className="flex-1 overflow-y-auto px-6 py-7">
        <div className="max-w-[720px] mx-auto space-y-5">
          {currentStep?.title && (
            <h1 className="text-[22px] font-bold text-[var(--text-primary)] tracking-tight">
              {currentStep.title}
            </h1>
          )}

          {currentStep?.type === 'quiz' && currentStep.quiz ? (
            <QuizStep
              key={`${topic._id}-${index}`}
              quiz={currentStep.quiz}
              onAnswered={() => setAnsweredQuizzes((prev) => ({ ...prev, [index]: true }))}
            />
          ) : currentStep?.type === 'exercise' && currentStep.exercise ? (
            <ExerciseRunner key={`${topic._id}-${index}`} exercise={currentStep.exercise} />
          ) : currentStep ? (
            <Card className="p-6">
              <LessonContentBlock block={currentStep} />
            </Card>
          ) : null}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] flex items-center justify-between gap-4 shrink-0">
        <Button
          variant="secondary"
          disabled={index === 0}
          onClick={handlePrev}
          icon={<IconChevronLeft size={16} />}
        >
          Previous
        </Button>

        <span className="text-[12px] text-[var(--text-tertiary)] hidden md:inline-flex items-center gap-1.5">
          <Kbd>←</Kbd> <Kbd>→</Kbd> navigate steps
        </span>

        <Button
          onClick={() => void handleNext()}
          disabled={isQuizLocked}
          loading={completing}
          icon={isLastStep ? <IconCheck size={16} /> : <IconArrowRight size={16} />}
        >
          {isLastStep ? 'Complete Lesson' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

export function LessonWorkspacePage() {
  const { id: courseId, topicId } = useParams<{ id: string; topicId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { fetchTopicProgress, saveContentPosition, completeTopic, fetchDashboard } = useProgressStore();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [treeOpen, setTreeOpen] = useState(true);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<TopicContent | undefined>(undefined);
  const [tutorWidth, setTutorWidth] = useState(340);

  useEffect(() => {
    if (!courseId || !topicId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const loadOffline = async () => {
        const [t, c, chs, topics, pay] = await Promise.all([
          getOfflineTopicById(topicId),
          getOfflineCourseDetail(courseId),
          getOfflineChapters(courseId),
          getOfflineTopics(courseId),
          getCachedPaymentStatus(),
        ]);
        if (cancelled) return;
        const access = c ? checkOfflineCourseAccess(c, user, pay) : true;
        const local = await getLocalCourseProgress(courseId, user?._id || user?.id);
        setChapters(computeChaptersWithStatus(chs, topics, local, access));
        setTopic(t);
        const prog = await fetchTopicProgress(topicId);
        if (!cancelled) {
          setInitialIndex(prog?.lastContentIndex || 0);
          setLoading(false);
        }
      };

      try {
        if (!(await isOnline())) {
          await loadOffline();
          return;
        }
        const [tRes, chRes, prog] = await Promise.all([
          topicApi.get(topicId),
          chapterApi.byCourse(courseId).catch(() => ({ data: [] })),
          fetchTopicProgress(topicId),
        ]);
        if (cancelled) return;
        const fetched: Topic = tRes.data;
        setTopic(fetched);
        setChapters(chRes.data || []);
        setInitialIndex(prog?.lastContentIndex || 0);
        if (fetched) void cacheTopicDetail(topicId, fetched);
        setLoading(false);
      } catch {
        await loadOffline();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, topicId, user, fetchTopicProgress]);

  const flatTopics = useMemo(() => chapters.flatMap((ch) => ch.topics || []), [chapters]);
  const nextTopicId = useMemo(() => {
    const idx = flatTopics.findIndex((t) => t._id === topicId);
    return idx >= 0 && idx + 1 < flatTopics.length ? flatTopics[idx + 1]._id : undefined;
  }, [flatTopics, topicId]);

  const startResizeTutor = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = tutorWidth;
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(280, Math.min(520, startW + (startX - ev.clientX)));
      setTutorWidth(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!topic || !courseId) {
    return (
      <div className="p-10 max-w-xl mx-auto">
        <EmptyState
          mascot
          title="Lesson unavailable"
          description="We couldn't load this lesson. Make sure you're online or have downloaded the course."
          action={<Button onClick={() => navigate(`/course/${courseId}`)}>Back to Course</Button>}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Pane 1: Collapsible Curriculum Tree */}
      {treeOpen && (
        <aside className="w-[260px] shrink-0 border-r border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col min-h-0">
          <div className="px-3.5 py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate(`/course/${courseId}`)}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <IconArrowLeft size={15} /> Course
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Topic Flashcards"
                onClick={() => navigate(`/course/${courseId}/topic/${topic._id}/flashcards`)}
                className="p-1 rounded hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] cursor-pointer"
              >
                <IconCards size={15} />
              </button>
              <button
                type="button"
                title="Topic MCQs"
                onClick={() => navigate(`/course/${courseId}/topic/${topic._id}/mcq`)}
                className="p-1 rounded hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] cursor-pointer"
              >
                <IconListCheck size={15} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
            {chapters.map((ch, cIdx) => (
              <div key={ch._id}>
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Ch {cIdx + 1}: {ch.title}
                </div>
                <div className="space-y-0.5 mt-1">
                  {(ch.topics || []).map((t) => {
                    const active = t._id === topic._id;
                    return (
                      <button
                        key={t._id}
                        type="button"
                        disabled={t.isUnlocked === false}
                        onClick={() => navigate(`/course/${courseId}/topic/${t._id}/learn`)}
                        className={[
                          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-left text-[12.5px] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed',
                          active
                            ? 'bg-[var(--brand-primary-soft)] text-[var(--text-primary)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]',
                        ].join(' ')}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            t.isCompleted
                              ? 'bg-[var(--success)]'
                              : active
                                ? 'bg-[var(--brand-primary)]'
                                : 'bg-[var(--border-strong)]'
                          }`}
                        />
                        <span className="truncate">{t.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Pane 2: Center StepPlayer */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setTreeOpen((v) => !v)}
              title={treeOpen ? 'Hide curriculum' : 'Show curriculum'}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] cursor-pointer"
            >
              <IconListTree size={16} />
            </button>
            <span className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">
              {topic.title}
            </span>
          </div>
          <Badge variant="gold">+{topic.xp || 50} XP</Badge>
        </div>

        <div className="flex-1 min-h-0">
          <StepPlayer
            topic={topic}
            initialIndex={initialIndex}
            tutorOpen={tutorOpen}
            onToggleTutor={() => setTutorOpen((v) => !v)}
            onStepChange={setActiveStep}
            onSavePosition={(idx) =>
              void saveContentPosition({ course: courseId, topic: topic._id, contentIndex: idx })
            }
            onComplete={async () => {
              const res = await completeTopic({ courseId, topicId: topic._id });
              void fetchDashboard();
              return {
                earnedXp: res.earnedXp || topic.xp || 50,
                isCourseComplete: !!res.isCourseComplete,
              };
            }}
            onNextTopic={
              nextTopicId ? () => navigate(`/course/${courseId}/topic/${nextTopicId}/learn`) : undefined
            }
            onBackToCourse={() => navigate(`/course/${courseId}`)}
          />
        </div>
      </div>

      {/* Pane 3: Resizable Docked In-Lesson AI Tutor */}
      {tutorOpen && (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={startResizeTutor}
            className="w-1.5 shrink-0 cursor-col-resize bg-[var(--border-subtle)] hover:bg-[var(--brand-ai)] transition-colors"
          />
          <div style={{ width: tutorWidth }} className="shrink-0 h-full">
            <InLessonAiTutor
              topicTitle={topic.title}
              stepTitle={activeStep?.title}
              stepContent={activeStep?.content}
              onClose={() => setTutorOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
