import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconAward, IconCheck, IconRotate, IconX } from '@tabler/icons-react';
import { Badge, Button, Card, EmptyState, ProgressBar, Skeleton } from '@/components/ui';
import { aiApi } from '@/lib/api';
import { AiHistoryItem, AiQuizQuestion } from '@/lib/types';
import { useProgressStore } from '@/stores/progress.store';
import { RichMathText } from '@/features/lesson/RichContent';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AiQuizAttemptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const submitMcqSession = useProgressStore((s) => s.submitMcqSession);

  const [item, setItem] = useState<AiHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    aiApi
      .getHistoryById(id)
      .then((res) => {
        if (!cancelled) {
          setItem(res.data || null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const questions: AiQuizQuestion[] = Array.isArray(item?.result)
    ? (item.result as AiQuizQuestion[])
    : [];
  const current = questions[index];

  const handleSubmit = () => {
    setSubmitted(true);
    const correct = questions.filter((q, idx) => q.options[selected[idx]]?.isCorrect).length;
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const courseId = (item?.metadata?.courseId as string | undefined) || item?._id || '';
    if (courseId) {
      void submitMcqSession({
        course: courseId,
        mcqAnswered: questions.length,
        mcqCorrect: correct,
        score,
        duration: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
      });
    }
  };

  useEffect(() => {
    if (submitted || !current) return;
    const onKey = (e: KeyboardEvent) => {
      const num = Number(e.key);
      if (num >= 1 && num <= current.options.length) {
        e.preventDefault();
        setSelected((s) => ({ ...s, [index]: num - 1 }));
        return;
      }
      const lIdx = LETTERS.indexOf(e.key.toUpperCase());
      if (lIdx >= 0 && lIdx < current.options.length) {
        e.preventDefault();
        setSelected((s) => ({ ...s, [index]: lIdx }));
        return;
      }
      if (e.key === 'ArrowRight' && index + 1 < questions.length) {
        e.preventDefault();
        setIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        setIndex((i) => i - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitted, current, index, questions.length]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!item || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-10">
        <EmptyState
          mascot
          title="Quiz not found"
          action={<Button onClick={() => navigate('/ai-quiz')}>Back to Quiz Hub</Button>}
        />
      </div>
    );
  }

  if (submitted) {
    const correct = questions.filter((q, idx) => q.options[selected[idx]]?.isCorrect).length;
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="max-w-[760px] mx-auto p-6 space-y-6">
        <Card variant="featured" className="text-center p-7 space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--brand-ai-soft)] text-[var(--brand-ai)] flex items-center justify-center mx-auto">
            <IconAward size={30} />
          </div>
          <div>
            <Badge variant={pct >= 70 ? 'success' : 'gold'}>Quiz Results</Badge>
            <h1 className="text-[30px] font-bold mt-2">{pct}%</h1>
            <p className="text-[14px] text-[var(--text-tertiary)]">
              {correct} of {questions.length} correct
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/ai-quiz')}>
              Back to Quiz Hub
            </Button>
            <Button
              variant="ai"
              icon={<IconRotate size={15} />}
              onClick={() => {
                setIndex(0);
                setSelected({});
                setSubmitted(false);
                startedAt.current = Date.now();
              }}
            >
              Retake Quiz
            </Button>
          </div>
        </Card>

        {/* Review with RichMathText (fixes mobile raw LaTeX bug) */}
        <div className="space-y-3">
          {questions.map((q, qIdx) => {
            const pickedIdx = selected[qIdx];
            const ok = pickedIdx !== undefined && !!q.options[pickedIdx]?.isCorrect;
            return (
              <Card key={qIdx} className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-[14.5px]">
                    {qIdx + 1}. <RichMathText text={q.question} />
                  </div>
                  <Badge variant={ok ? 'success' : 'danger'}>{ok ? 'Correct' : 'Incorrect'}</Badge>
                </div>
                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => {
                    const isPicked = pickedIdx === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={[
                          'px-3 py-2 rounded-[var(--radius-sm)] text-[13.5px] flex items-center justify-between gap-2 border',
                          opt.isCorrect
                            ? 'bg-[var(--success-bg)]/60 border-[var(--success)]'
                            : isPicked
                              ? 'bg-[var(--danger-bg)]/60 border-[var(--danger)]'
                              : 'border-[var(--border-subtle)]',
                        ].join(' ')}
                      >
                        <RichMathText text={opt.text} />
                        {opt.isCorrect && <IconCheck size={15} className="text-[var(--success)] shrink-0" />}
                        {!opt.isCorrect && isPicked && (
                          <IconX size={15} className="text-[var(--danger)] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] text-[13px] text-[var(--text-secondary)]">
                    <RichMathText text={q.explanation} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(selected).length;

  return (
    <div className="max-w-[740px] mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          icon={<IconArrowLeft size={16} />}
          onClick={() => navigate('/ai-quiz')}
        >
          Quiz Hub
        </Button>
        <div className="text-center min-w-0">
          <div className="font-bold text-[14px] truncate">{item.title || item.prompt}</div>
          <div className="text-[12px] text-[var(--text-tertiary)]">
            Question {index + 1} of {questions.length} · {answeredCount}/{questions.length} answered
          </div>
        </div>
        <div className="w-16" />
      </div>

      <ProgressBar value={((index + 1) / questions.length) * 100} height={7} color="var(--brand-ai)" />

      <Card className="p-6 space-y-5">
        <div className="text-[17px] font-semibold leading-snug">
          <RichMathText text={current.question} />
        </div>

        <div className="space-y-2.5" role="radiogroup">
          {current.options.map((opt, oIdx) => {
            const isSel = selected[index] === oIdx;
            return (
              <button
                key={oIdx}
                type="button"
                role="radio"
                aria-checked={isSel}
                onClick={() => setSelected((s) => ({ ...s, [index]: oIdx }))}
                className={[
                  'w-full flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border text-left cursor-pointer transition-colors',
                  isSel
                    ? 'border-[var(--brand-ai)] bg-[var(--brand-ai-soft)]/50'
                    : 'border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-sunken)]/60',
                ].join(' ')}
              >
                <span className="w-7 h-7 rounded-full border border-[var(--border-strong)] bg-[var(--surface-card)] text-[12px] font-bold flex items-center justify-center shrink-0">
                  {LETTERS[oIdx] || oIdx + 1}
                </span>
                <span className="flex-1 text-[14.5px]">
                  <RichMathText text={opt.text} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            Previous
          </Button>
          {index + 1 < questions.length ? (
            <Button onClick={() => setIndex((i) => i + 1)} icon={<IconArrowRight size={16} />}>
              Next
            </Button>
          ) : (
            <Button variant="ai" onClick={handleSubmit} icon={<IconCheck size={16} />}>
              Submit Quiz
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
