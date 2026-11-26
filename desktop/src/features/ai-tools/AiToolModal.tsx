import React, { useState } from 'react';
import { IconSparkles } from '@tabler/icons-react';
import { Button, Card, Modal } from '@/components/ui';
import { aiApi } from '@/lib/api';
import { AiFlashcard } from '@/lib/types';
import { SafeMarkdown } from '@/features/lesson/RichContent';

export type QuickAiToolKind = 'summarizer' | 'flashcards' | 'qa' | null;

export function AiToolModal({ kind, onClose }: { kind: QuickAiToolKind; onClose: () => void }) {
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textResult, setTextResult] = useState<string | null>(null);
  const [cardsResult, setCardsResult] = useState<AiFlashcard[] | null>(null);

  if (!kind) return null;

  const title =
    kind === 'summarizer'
      ? 'AI Note Summarizer'
      : kind === 'flashcards'
        ? 'AI Flashcard Builder'
        : 'AI Q&A Tutor';

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setTextResult(null);
    setCardsResult(null);

    try {
      if (kind === 'summarizer') {
        const res = await aiApi.summarize(input.trim());
        setTextResult(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
      } else if (kind === 'flashcards') {
        const res = await aiApi.generateFlashcards(input.trim(), count);
        setCardsResult(Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await aiApi.qa(input.trim(), context.trim() || undefined);
        setTextResult(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={!!kind} onClose={onClose} title={title} maxWidth={640}>
      <form onSubmit={handleRun} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">
            {kind === 'summarizer'
              ? 'Paste lecture notes or reading'
              : kind === 'flashcards'
                ? 'Topic or concept'
                : 'Your question'}
          </label>
          <textarea
            rows={kind === 'summarizer' ? 6 : 3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              kind === 'summarizer'
                ? 'Paste text to summarize...'
                : kind === 'flashcards'
                  ? 'e.g. Memory Hierarchy & Cache Mapping in Computer Architecture'
                  : 'e.g. Why is Big-O of binary search O(log n)?'
            }
            className="w-full p-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[14px] focus:outline-none focus:border-[var(--brand-ai)]"
          />
        </div>

        {kind === 'qa' && (
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">
              Optional context
            </label>
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Course name or snippet (optional)"
              className="w-full h-10 px-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[14px]"
            />
          </div>
        )}

        {kind === 'flashcards' && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Cards:</span>
            {[3, 5, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={`px-3 py-1 rounded-full text-[12.5px] font-semibold cursor-pointer ${
                  count === n
                    ? 'bg-[var(--brand-ai)] text-white'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--danger-bg)] text-[var(--danger)] text-[13px]">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="ai"
            loading={loading}
            disabled={!input.trim()}
            icon={<IconSparkles size={16} />}
          >
            Generate
          </Button>
        </div>
      </form>

      {textResult && (
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
          <SafeMarkdown content={textResult} />
        </div>
      )}

      {cardsResult && cardsResult.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] space-y-2.5">
          {cardsResult.map((c, i) => (
            <Card key={i} className="p-3.5">
              <div className="font-semibold text-[14px]">Q: {c.front}</div>
              <div className="text-[13.5px] text-[var(--text-secondary)] mt-1">A: {c.back}</div>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
}
