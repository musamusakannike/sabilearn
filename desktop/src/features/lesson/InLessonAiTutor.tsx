import React, { useEffect, useRef, useState } from 'react';
import { IconRotate, IconSend, IconSparkles, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { streamAiExplain } from '@/lib/api';
import { SafeMarkdown } from './RichContent';

export interface InLessonAiTutorProps {
  topicTitle: string;
  stepTitle?: string;
  stepContent?: string;
  onClose: () => void;
}

export function InLessonAiTutor({
  topicTitle,
  stepTitle,
  stepContent,
  onClose,
}: InLessonAiTutorProps) {
  const [mode, setMode] = useState<'eli5' | 'analogy' | 'custom'>('eli5');
  const [question, setQuestion] = useState('');
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // Cancel stream and reset when lesson step changes
  useEffect(() => {
    cancelRef.current?.();
    setText('');
    setError(null);
    setStreaming(false);
    return () => {
      cancelRef.current?.();
    };
  }, [topicTitle, stepTitle, stepContent]);

  const ask = (nextMode: 'eli5' | 'analogy' | 'custom', customQ?: string) => {
    cancelRef.current?.();
    setMode(nextMode);
    setText('');
    setError(null);
    setStreaming(true);

    cancelRef.current = streamAiExplain(
      {
        mode: nextMode,
        topicTitle,
        stepTitle,
        stepContent,
        question: nextMode === 'custom' ? customQ : undefined,
      },
      {
        onChunk: (chunk) => setText((prev) => prev + chunk),
        onDone: () => setStreaming(false),
        onError: (err) => {
          setStreaming(false);
          setError(err.message || 'Could not reach AI Tutor.');
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || streaming) return;
    const q = question.trim();
    setQuestion('');
    ask('custom', q);
  };

  return (
    <aside
      aria-label="In-lesson AI Tutor"
      className="h-full flex flex-col bg-[var(--surface-card)] border-l border-[var(--border-default)]"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--brand-ai)] text-white flex items-center justify-center shrink-0">
            <IconSparkles size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold text-[var(--text-primary)]">AI Tutor</div>
            <div className="text-[11px] text-[var(--text-tertiary)] truncate">
              {stepTitle || topicTitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {text && !streaming && (
            <button
              type="button"
              onClick={() => ask(mode)}
              title="Regenerate"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] cursor-pointer"
            >
              <IconRotate size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Tutor"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] cursor-pointer"
          >
            <IconX size={16} />
          </button>
        </div>
      </div>

      {/* Quick Mode Buttons */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]/40 shrink-0">
        <Button
          size="sm"
          variant={mode === 'eli5' && text ? 'ai' : 'secondary'}
          onClick={() => ask('eli5')}
          disabled={streaming}
        >
          Explain Simply
        </Button>
        <Button
          size="sm"
          variant={mode === 'analogy' && text ? 'ai' : 'secondary'}
          onClick={() => ask('analogy')}
          disabled={streaming}
        >
          Analogy
        </Button>
      </div>

      {/* Streaming Output */}
      <div className="flex-1 overflow-y-auto p-4 text-[14px]">
        {error && (
          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--danger-bg)] text-[var(--danger)] text-[13px]">
            {error}
          </div>
        )}

        {!text && !streaming && !error && (
          <div className="text-center py-8 px-3 space-y-2">
            <img
              src="/assets/onboarding/tutor-mascot.webp"
              alt="AI Tutor"
              className="w-16 h-16 object-contain mx-auto select-none"
            />
            <p className="text-[13.5px] font-semibold text-[var(--text-primary)]">
              Stuck on this step?
            </p>
            <p className="text-[12.5px] text-[var(--text-tertiary)]">
              Pick Explain Simply, request a relatable analogy, or ask your own question below.
            </p>
          </div>
        )}

        {text && <SafeMarkdown content={text} />}

        {streaming && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[var(--brand-ai)] font-medium">
            <span className="w-2 h-2 rounded-full bg-[var(--brand-ai)] animate-pulse" />
            Thinking...
          </div>
        )}
      </div>

      {/* Custom Question Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[var(--border-subtle)] flex items-center gap-2 shrink-0"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this step..."
          className="flex-1 h-9 px-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-ai)]"
        />
        <Button
          type="submit"
          variant="ai"
          size="sm"
          disabled={!question.trim() || streaming}
          icon={<IconSend size={15} />}
          aria-label="Send question"
        />
      </form>
    </aside>
  );
}
