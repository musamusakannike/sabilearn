import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconCheck, IconRotate, IconX } from '@tabler/icons-react';
import { Badge, Button, Card, EmptyState, ProgressBar, Skeleton } from '@/components/ui';
import { mcqApi, topicApi } from '@/lib/api';
import { cacheMcqs, getCachedMcqs, isOnline } from '@/lib/offlineSync';
import { MCQ, Topic } from '@/lib/types';
import { useProgressStore } from '@/stores/progress.store';
import { RichMathText } from '@/features/lesson/RichContent';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function McqDeckPage() {
  const { id: courseId, topicId } = useParams<{ id: string; topicId?: string }>();
  const navigate = useNavigate();
  const submitMcqSession = useProgressStore((s) => s.submitMcqSession);

  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    const cacheKey = topicId ? `${courseId}_${topicId}` : courseId;

    (async () => {
      try {
        if (await isOnline()) {
          let loaded: MCQ[] = [];
          if (topicId) {
            const res = await mcqApi.byTopic(topicId);
            loaded = res.data || [];
          } else {
            const tRes = await topicApi.byCourse(courseId);
            const topics: Topic[] = tRes.data || [];
            const lists = await Promise.all(
              topics.slice(0, 20).map((t) =>
                mcqApi
                  .byTopic(t._id)
                  .then((r) => (r.data || []) as MCQ[])
                  .catch(() => [] as MCQ[])
              )
            );
            loaded = lists.flat();
          }
          if (!cancelled) {
            setMcqs(loaded);
            void cacheMcqs(cacheKey, loaded);
            setLoading(false);
          }
          return;
        }
      } catch {
        // fallback below
      }
      const cached = await getCachedMcqs(cacheKey);
      if (!cancelled) {
        setMcqs(cached);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, topicId]);

  const current = mcqs[index];

  const selectOption = (oIdx: number) => {
    if (selectedIdx !== null || !current) return;
    setSelectedIdx(oIdx);
    if (current.options[oIdx]?.isCorrect) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (selectedIdx === null) return;
    if (index + 1 < mcqs.length) {
      setIndex((i) => i + 1);
      setSelectedIdx(null);
    } else {
      setDone(true);
      const score = Math.round((correctCount / mcqs.length) * 100);
      if (courseId) {
        void submitMcqSession({
          course: courseId,
          topic: topicId,
          mcqAnswered: mcqs.length,
          mcqCorrect: correctCount,
          score,
          duration: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
        });
      }
    }
  };

  useEffect(() => {
    if (done || !current) return;
    const onKey = (e: KeyboardEvent) => {
      if (selectedIdx === null) {
        const num = Number(e.key);
        if (num >= 1 && num <= current.options.length) {
          e.preventDefault();
          selectOption(num - 1);
          return;
        }
        const lIdx = LETTERS.indexOf(e.key.toUpperCase());
        if (lIdx >= 0 && lIdx < current.options.length) {
          e.preventDefault();
          selectOption(lIdx);
          return;
        }
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, current, selectedIdx, index, correctCount]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (mcqs.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-10">
        <EmptyState
          mascot
          title="No practice MCQs available yet"
          action={<Button onClick={() => navigate(`/course/${courseId}`)}>Back to Course</Button>}
        />
      </div>
    );
  }

  if (done) {
    const pct = Math.round((correctCount / mcqs.length) * 100);
    return (
      <div className="max-w-lg mx-auto p-10">
        <Card variant="featured" className="text-center p-7 space-y-4">
          <Badge variant={pct >= 70 ? 'success' : 'gold'}>Practice Complete</Badge>
          <h1 className="text-[30px] font-bold">{pct}%</h1>
          <p className="text-[14px] text-[var(--text-tertiary)]">
            You answered {correctCount} out of {mcqs.length} questions correctly.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate(`/course/${courseId}`)}>
              Back to Course
            </Button>
            <Button
              icon={<IconRotate size={15} />}
              onClick={() => {
                setIndex(0);
                setSelectedIdx(null);
                setCorrectCount(0);
                setDone(false);
                startedAt.current = Date.now();
              }}
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<IconArrowLeft size={16} />}
          onClick={() => navigate(`/course/${courseId}`)}
        >
          Back to Course
        </Button>
        <span className="text-[13px] font-semibold text-[var(--text-tertiary)]">
          Question {index + 1} of {mcqs.length}
        </span>
      </div>

      <ProgressBar value={((index + 1) / mcqs.length) * 100} height={7} />

      <Card className="p-6 space-y-5">
        <div className="text-[17px] font-semibold leading-snug">
          <RichMathText text={current.question} />
        </div>

        <div className="space-y-2.5" role="radiogroup">
          {current.options.map((opt, oIdx) => {
            const isSelected = selectedIdx === oIdx;
            let cls = 'border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-sunken)]/60';
            if (selectedIdx !== null) {
              if (opt.isCorrect) cls = 'border-[var(--success)] bg-[var(--success-bg)]/60';
              else if (isSelected) cls = 'border-[var(--danger)] bg-[var(--danger-bg)]/60';
            }
            return (
              <button
                key={oIdx}
                type="button"
                disabled={selectedIdx !== null}
                onClick={() => selectOption(oIdx)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border text-left cursor-pointer disabled:cursor-default ${cls}`}
              >
                <span className="w-7 h-7 rounded-full border border-[var(--border-strong)] bg-[var(--surface-card)] text-[12px] font-bold flex items-center justify-center shrink-0">
                  {LETTERS[oIdx] || oIdx + 1}
                </span>
                <span className="flex-1 text-[14.5px]">
                  <RichMathText text={opt.text} />
                </span>
                {selectedIdx !== null && opt.isCorrect && <IconCheck size={18} className="text-[var(--success)]" />}
                {selectedIdx !== null && isSelected && !opt.isCorrect && (
                  <IconX size={18} className="text-[var(--danger)]" />
                )}
              </button>
            );
          })}
        </div>

        {selectedIdx !== null && current.explanation && (
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] text-[13.5px] text-[var(--text-secondary)]">
            <RichMathText text={current.explanation} />
          </div>
        )}

        {selectedIdx !== null && (
          <div className="flex justify-end">
            <Button onClick={handleNext} icon={<IconArrowRight size={16} />}>
              {index + 1 < mcqs.length ? 'Next Question' : 'Finish'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
