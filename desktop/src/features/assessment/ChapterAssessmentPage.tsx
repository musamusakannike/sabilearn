import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconAward, IconCheck, IconRotate, IconX } from '@tabler/icons-react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ProgressBar, Skeleton } from '@/components/ui';
import { chapterApi, progressApi } from '@/lib/api';
import { isOnline } from '@/lib/offlineSync';
import {
  clearAssessmentProgressOffline,
  getOfflineChapters,
  saveAssessmentProgressOffline,
} from '@/lib/offlineCourses';
import { Exercise, Question } from '@/lib/types';
import { useAuthStore } from '@/stores/auth.store';
import { useProgressStore } from '@/stores/progress.store';
import { RichMathText } from '@/features/lesson/RichContent';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function ChapterAssessmentPage() {
  const { id: courseId, chapterId } = useParams<{ id: string; chapterId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const submitExercise = useProgressStore((s) => s.submitExercise);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [chapterTitle, setChapterTitle] = useState('Chapter Capstone Assessment');
  const [loading, setLoading] = useState(true);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [result, setResult] = useState<{
    scorePercent: number;
    isPassed: boolean;
    earnedXp: number;
    alreadyRewarded: boolean;
  } | null>(null);

  const startedAtRef = useRef(Date.now());
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!courseId || !chapterId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        if (await isOnline()) {
          const [assRes, chRes, savedRes] = await Promise.all([
            chapterApi.getAssessment(chapterId),
            chapterApi.byCourse(courseId).catch(() => ({ data: [] })),
            progressApi.assessmentProgress(chapterId).catch(() => ({ data: null })),
          ]);
          if (cancelled) return;
          setExercise(assRes.data || null);
          const ch = (chRes.data || []).find((c: { _id: string; title: string }) => c._id === chapterId);
          if (ch?.title) setChapterTitle(ch.title);
          if (savedRes.data) {
            setIndex(savedRes.data.currentIndex || 0);
            setAnswers(savedRes.data.userAnswers || {});
            setChecked(savedRes.data.checkedSteps || {});
          }
          setLoading(false);
          return;
        }
      } catch {
        // fallback offline
      }

      const chs = await getOfflineChapters(courseId);
      const ch = chs.find((c) => c._id === chapterId);
      if (!cancelled) {
        if (ch) {
          setChapterTitle(ch.title);
          setExercise(ch.exercise || null);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, chapterId]);

  const questions: Question[] = exercise?.questions || [];
  const q = questions[index];

  const persistProgress = (nextIdx: number, nextAns: Record<number, string>, nextChk: Record<number, boolean>) => {
    if (!courseId || !chapterId) return;
    const payload = { currentIndex: nextIdx, userAnswers: nextAns, checkedSteps: nextChk };
    void (async () => {
      if (await isOnline()) {
        await progressApi.saveAssessmentProgress(chapterId, payload).catch(() => {});
      } else {
        await saveAssessmentProgressOffline(
          courseId,
          chapterId,
          {
            currentIndex: nextIdx,
            userAnswers: nextAns as unknown as Record<string, string>,
            checkedSteps: nextChk as unknown as Record<string, boolean>,
          },
          userId
        );
      }
    })();
  };

  const isAnswerCorrect = (question: Question, ans: string | undefined): boolean => {
    if (!ans) return false;
    return ans.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
  };

  const handleCheck = () => {
    if (!q || checked[index] || !answers[index]?.trim()) return;
    const nextChk = { ...checked, [index]: true };
    setChecked(nextChk);
    persistProgress(index, answers, nextChk);
  };

  const handleNextOrFinish = async () => {
    if (!q || !checked[index]) return;
    if (index + 1 < questions.length) {
      const next = index + 1;
      setIndex(next);
      persistProgress(next, answers, checked);
      return;
    }

    if (!courseId || !chapterId) return;
    setSubmitting(true);
    try {
      const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
      const payloadAnswers = questions.map((item, idx) => ({
        questionId: item._id || `q_${idx}`,
        questionXp: item.xp || 20,
        isCorrect: isAnswerCorrect(item, answers[idx]),
      }));
      const res = await submitExercise({
        courseId,
        chapterId,
        answers: payloadAnswers,
        duration,
      });

      if (await isOnline()) {
        await progressApi.clearAssessmentProgress(chapterId).catch(() => {});
      } else {
        await clearAssessmentProgressOffline(courseId, chapterId, userId);
      }

      setResult({
        scorePercent: res?.scorePercent ?? 0,
        isPassed: !!res?.isPassed,
        earnedXp: res?.earnedXp ?? 0,
        alreadyRewarded: !!res?.alreadyRewarded,
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (result || !q) return;
    const onKey = (e: KeyboardEvent) => {
      if (q.type === 'mcq' && !checked[index]) {
        const opts = q.options || [];
        const num = Number(e.key);
        if (num >= 1 && num <= opts.length) {
          e.preventDefault();
          setAnswers((prev) => ({ ...prev, [index]: opts[num - 1] }));
          return;
        }
        const lIdx = LETTERS.indexOf(e.key.toUpperCase());
        if (lIdx >= 0 && lIdx < opts.length) {
          e.preventDefault();
          setAnswers((prev) => ({ ...prev, [index]: opts[lIdx] }));
          return;
        }
      }
      if (e.key === 'Enter') {
        if (!checked[index] && answers[index]?.trim()) {
          e.preventDefault();
          handleCheck();
        } else if (checked[index]) {
          e.preventDefault();
          void handleNextOrFinish();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, q, index, checked, answers]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!exercise || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-10">
        <EmptyState
          mascot
          title="No assessment questions available"
          action={<Button onClick={() => navigate(`/course/${courseId}`)}>Back to Course</Button>}
        />
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-[760px] mx-auto p-6 space-y-6">
        <Card variant="featured" className="text-center p-7 space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center mx-auto">
            <IconAward size={30} />
          </div>
          <div>
            <Badge variant={result.isPassed ? 'success' : 'danger'}>
              {result.isPassed ? 'Assessment Passed' : 'Needs 50% to Pass'}
            </Badge>
            <h1 className="text-[28px] font-bold mt-2">{result.scorePercent}%</h1>
            <p className="text-[13.5px] text-[var(--text-tertiary)] mt-1">
              {result.earnedXp > 0
                ? `+${result.earnedXp} XP earned`
                : result.alreadyRewarded
                  ? 'XP already awarded for this capstone'
                  : 'Review the explanations below and retake anytime'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            <Button variant="secondary" onClick={() => navigate(`/course/${courseId}`)}>
              Back to Course
            </Button>
            <Button
              icon={<IconRotate size={15} />}
              onClick={() => {
                setIndex(0);
                setAnswers({});
                setChecked({});
                setResult(null);
                startedAtRef.current = Date.now();
              }}
            >
              Retake Assessment
            </Button>
          </div>
        </Card>

        {/* Review Breakdown — fixes mobile bug by rendering KaTeX via RichMathText */}
        <div className="space-y-3">
          <h2 className="text-[16px] font-bold">Question Breakdown</h2>
          {questions.map((item, idx) => {
            const uAns = answers[idx] || '(No answer)';
            const ok = isAnswerCorrect(item, answers[idx]);
            return (
              <Card key={item._id || idx} className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-[14.5px]">
                    {idx + 1}. <RichMathText text={item.question} />
                  </div>
                  <Badge variant={ok ? 'success' : 'danger'}>{ok ? 'Correct' : 'Incorrect'}</Badge>
                </div>
                <div className="text-[13px] space-y-1">
                  <div>
                    <span className="text-[var(--text-tertiary)]">Your answer: </span>
                    <span className={ok ? 'text-[var(--success)] font-semibold' : 'text-[var(--danger)] font-semibold'}>
                      <RichMathText text={uAns} />
                    </span>
                  </div>
                  {!ok && (
                    <div>
                      <span className="text-[var(--text-tertiary)]">Correct answer: </span>
                      <span className="text-[var(--success)] font-semibold">
                        <RichMathText text={item.correctAnswer} />
                      </span>
                    </div>
                  )}
                </div>
                {item.explanation && (
                  <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] text-[13px] text-[var(--text-secondary)]">
                    <RichMathText text={item.explanation} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const currentAnswer = answers[index] || '';
  const isCurrentChecked = !!checked[index];
  const isCurrentCorrect = isAnswerCorrect(q, currentAnswer);

  return (
    <div className="max-w-[740px] mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          icon={<IconArrowLeft size={16} />}
          onClick={() => setLeaveConfirm(true)}
        >
          Exit
        </Button>
        <div className="text-center">
          <div className="text-[14px] font-bold">{chapterTitle}</div>
          <div className="text-[12px] text-[var(--text-tertiary)]">
            Question {index + 1} of {questions.length}
          </div>
        </div>
        <Badge variant="gold">+{q.xp || 20} XP</Badge>
      </div>

      <ProgressBar value={((index + 1) / questions.length) * 100} height={7} />

      <Card className="p-6 space-y-5">
        <Badge variant="ai">{q.type === 'fill_in_blank' ? 'Fill in the Blank' : 'Multiple Choice'}</Badge>

        <div className="text-[17px] font-semibold leading-snug">
          <RichMathText text={q.question} />
        </div>

        {q.type === 'fill_in_blank' ? (
          <input
            value={currentAnswer}
            disabled={isCurrentChecked}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [index]: e.target.value }))}
            placeholder="Type your answer..."
            className="w-full h-11 px-3.5 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[14.5px] focus:outline-none focus:border-[var(--brand-primary)]"
          />
        ) : (
          <div className="space-y-2.5" role="radiogroup">
            {(q.options || []).map((opt, oIdx) => {
              const selected = currentAnswer === opt;
              const optCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              let cls = 'border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-sunken)]/60';
              if (isCurrentChecked) {
                if (optCorrect) cls = 'border-[var(--success)] bg-[var(--success-bg)]/60';
                else if (selected) cls = 'border-[var(--danger)] bg-[var(--danger-bg)]/60';
              } else if (selected) {
                cls = 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/50';
              }

              return (
                <button
                  key={oIdx}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isCurrentChecked}
                  onClick={() => setAnswers((prev) => ({ ...prev, [index]: opt }))}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border text-left cursor-pointer disabled:cursor-default ${cls}`}
                >
                  <span className="w-7 h-7 rounded-full border border-[var(--border-strong)] bg-[var(--surface-card)] text-[12px] font-bold flex items-center justify-center shrink-0">
                    {LETTERS[oIdx] || oIdx + 1}
                  </span>
                  <span className="flex-1 text-[14.5px]">
                    <RichMathText text={opt} />
                  </span>
                  {isCurrentChecked && optCorrect && <IconCheck size={18} className="text-[var(--success)]" />}
                  {isCurrentChecked && selected && !optCorrect && <IconX size={18} className="text-[var(--danger)]" />}
                </button>
              );
            })}
          </div>
        )}

        {isCurrentChecked && (
          <div
            role="status"
            className={`p-3.5 rounded-[var(--radius-md)] text-[13.5px] ${
              isCurrentCorrect ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--danger-bg)] text-[var(--danger)]'
            }`}
          >
            <div className="font-bold">{isCurrentCorrect ? 'Correct!' : 'Incorrect'}</div>
            {q.explanation && (
              <div className="mt-1 text-[var(--text-primary)]">
                <RichMathText text={q.explanation} />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          {!isCurrentChecked ? (
            <Button disabled={!currentAnswer.trim()} onClick={handleCheck}>
              Check Answer
            </Button>
          ) : (
            <Button
              loading={submitting}
              onClick={() => void handleNextOrFinish()}
              icon={<IconArrowRight size={16} />}
            >
              {index + 1 < questions.length ? 'Next Question' : 'Complete Assessment'}
            </Button>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={leaveConfirm}
        onClose={() => setLeaveConfirm(false)}
        onConfirm={() => navigate(`/course/${courseId}`)}
        title="Leave assessment?"
        description="Your progress is saved automatically. You can resume where you left off."
        confirmLabel="Leave"
      />
    </div>
  );
}
