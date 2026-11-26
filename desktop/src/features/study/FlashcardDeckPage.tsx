import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconCheck, IconRotate, IconX } from '@tabler/icons-react';
import { Badge, Button, Card, EmptyState, Kbd, ProgressBar, Skeleton } from '@/components/ui';
import { flashcardApi, topicApi } from '@/lib/api';
import { cacheFlashcards, getCachedFlashcards, isOnline } from '@/lib/offlineSync';
import { Flashcard, Topic } from '@/lib/types';
import { useProgressStore } from '@/stores/progress.store';
import { RichMathText } from '@/features/lesson/RichContent';

export function FlashcardDeckPage() {
  const { id: courseId, topicId } = useParams<{ id: string; topicId?: string }>();
  const navigate = useNavigate();
  const submitFlashcardSession = useProgressStore((s) => s.submitFlashcardSession);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [review, setReview] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    const cacheKey = topicId ? `${courseId}_${topicId}` : courseId;

    (async () => {
      try {
        if (await isOnline()) {
          let loaded: Flashcard[] = [];
          if (topicId) {
            const res = await flashcardApi.byTopic(topicId);
            loaded = res.data || [];
          } else {
            const tRes = await topicApi.byCourse(courseId);
            const topics: Topic[] = tRes.data || [];
            const lists = await Promise.all(
              topics.slice(0, 20).map((t) =>
                flashcardApi
                  .byTopic(t._id)
                  .then((r) => (r.data || []) as Flashcard[])
                  .catch(() => [] as Flashcard[])
              )
            );
            loaded = lists.flat();
          }
          if (!cancelled) {
            setCards(loaded);
            void cacheFlashcards(cacheKey, loaded);
            setLoading(false);
          }
          return;
        }
      } catch {
        // fallback below
      }
      const cached = await getCachedFlashcards(cacheKey);
      if (!cancelled) {
        setCards(cached);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, topicId]);

  const grade = (knewIt: boolean) => {
    const nextKnown = known + (knewIt ? 1 : 0);
    const nextReview = review + (knewIt ? 0 : 1);
    setKnown(nextKnown);
    setReview(nextReview);
    setFlipped(false);

    if (index + 1 < cards.length) {
      setIndex((i) => i + 1);
    } else {
      setDone(true);
      if (courseId) {
        void submitFlashcardSession({
          course: courseId,
          topic: topicId,
          flashcardsStudied: cards.length,
          duration: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
          knownCount: nextKnown,
          reviewCount: nextReview,
        });
      }
    }
  };

  useEffect(() => {
    if (done || cards.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && e.key === '1') {
        e.preventDefault();
        grade(false);
      } else if (flipped && e.key === '2') {
        e.preventDefault();
        grade(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, cards.length, flipped, index, known, review]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-10">
        <EmptyState
          mascot
          title="No flashcards for this deck yet"
          action={<Button onClick={() => navigate(`/course/${courseId}`)}>Back to Course</Button>}
        />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto p-10">
        <Card variant="featured" className="text-center p-7 space-y-4">
          <Badge variant="success">Session Complete</Badge>
          <h1 className="text-[24px] font-bold">Great study session!</h1>
          <div className="flex justify-center gap-6 text-[14px]">
            <div>
              <div className="text-[22px] font-bold text-[var(--success)]">{known}</div>
              <div className="text-[var(--text-tertiary)]">Knew it</div>
            </div>
            <div>
              <div className="text-[22px] font-bold text-[var(--warning)]">{review}</div>
              <div className="text-[var(--text-tertiary)]">Review again</div>
            </div>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate(`/course/${courseId}`)}>
              Back to Course
            </Button>
            <Button
              icon={<IconRotate size={15} />}
              onClick={() => {
                setIndex(0);
                setKnown(0);
                setReview(0);
                setFlipped(false);
                setDone(false);
                startedAt.current = Date.now();
              }}
            >
              Study Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="max-w-[680px] mx-auto p-6 space-y-5">
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
          Card {index + 1} of {cards.length}
        </span>
      </div>

      <ProgressBar value={((index + 1) / cards.length) * 100} height={7} />

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[280px] p-8 rounded-[var(--radius-xl)] bg-[var(--surface-card)] border-2 border-[var(--border-structural)] shadow-[var(--shadow-sm)] flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all hover:shadow-[var(--shadow-md)]"
      >
        <Badge variant={flipped ? 'success' : 'gold'}>{flipped ? 'Answer' : 'Question'}</Badge>
        <div className="text-[18px] font-semibold leading-relaxed text-[var(--text-primary)]">
          <RichMathText text={flipped ? card.answer : card.question} />
        </div>
        <div className="text-[12px] text-[var(--text-tertiary)] inline-flex items-center gap-1.5 mt-2">
          Click or press <Kbd>Space</Kbd> to flip
        </div>
      </button>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          disabled={!flipped}
          onClick={() => grade(false)}
          icon={<IconX size={16} />}
        >
          Review Again <Kbd className="ml-1">1</Kbd>
        </Button>
        <Button disabled={!flipped} onClick={() => grade(true)} icon={<IconCheck size={16} />}>
          I Knew It <Kbd className="ml-1 !bg-black/15 !border-black/20">2</Kbd>
        </Button>
      </div>
    </div>
  );
}
