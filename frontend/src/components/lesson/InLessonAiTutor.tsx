'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronUp, ArrowRight, CornerDownLeft, RotateCcw } from 'lucide-react';
import { streamAiExplain, ExplainLessonParams } from '@/lib/api';
import MarkdownContent from '@/components/ui/MarkdownContent';

interface InLessonAiTutorProps {
  topicTitle: string;
  stepTitle?: string;
  stepContent: string;
}

type ExplanationMode = 'eli5' | 'analogy' | 'custom';

export default function InLessonAiTutor({
  topicTitle,
  stepTitle,
  stepContent,
}: InLessonAiTutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [activeMode, setActiveMode] = useState<ExplanationMode>('eli5');
  const [customQuestion, setCustomQuestion] = useState('');
  
  // Streaming and typewriter text animation states
  const [fullBuffer, setFullBuffer] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const responseEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll detection: collapse floating widget while actively scrolling down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setIsScrollingDown(true);
      } else {
        setIsScrollingDown(false);
      }
      lastScrollY.current = currentScrollY;

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrollingDown(false);
      }, 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Progressive typewriter animation effect: smoothly increases displayed characters
  useEffect(() => {
    if (displayedText.length < fullBuffer.length) {
      const remaining = fullBuffer.length - displayedText.length;
      // Dynamically adjust step size: small smooth steps, speeds up if buffer is large
      const step = remaining > 100 ? 5 : remaining > 40 ? 3 : 1;
      const delay = remaining > 100 ? 12 : remaining > 40 ? 16 : 22;

      const timer = setTimeout(() => {
        setDisplayedText(fullBuffer.slice(0, displayedText.length + step));
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [displayedText, fullBuffer]);

  // Auto-scroll response container smoothly as text grows
  useEffect(() => {
    if (isOpen && isStreaming) {
      responseEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayedText, isOpen, isStreaming]);

  // Request explanation from DeepSeek streaming endpoint
  const requestExplanation = useCallback(
    async (mode: ExplanationMode, customQuery?: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setActiveMode(mode);
      setError(null);
      setFullBuffer('');
      setDisplayedText('');
      setIsStreaming(true);
      setIsOpen(true);

      const params: ExplainLessonParams = {
        mode,
        topicTitle,
        stepTitle,
        stepContent,
        question: customQuery,
      };

      try {
        await streamAiExplain(
          params,
          (chunk) => {
            setFullBuffer((prev) => prev + chunk);
          },
          controller.signal
        );
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err?.message || 'Could not stream explanation. Please try again.');
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [topicTitle, stepTitle, stepContent]
  );

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isStreaming) return;
    const q = customQuestion.trim();
    setCustomQuestion('');
    requestExplanation('custom', q);
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsOpen(false);
    setIsStreaming(false);
  };

  return (
    <>
      {/* Floating Action Widget */}
      {!isOpen && (
        <aside
          aria-label="In-Lesson AI Tutor"
          className={`fixed z-30 transition-all duration-300 pointer-events-auto ${
            isDismissed
              ? 'bottom-20 right-4'
              : 'bottom-20 right-4 sm:right-6 sm:bottom-22'
          }`}
        >
          {isDismissed ? (
            /* Re-open mini dock badge */
            <button
              onClick={() => setIsDismissed(false)}
              className="group flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-card)] px-3.5 py-2 shadow-lg shadow-black/10 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Show AI Tutor"
              type="button"
            >
              <span className="size-2 rounded-full bg-[#FF8A00]" />
              <span className="text-xs font-bold text-[var(--ink-900)] tracking-tight">
                AI Tutor
              </span>
            </button>
          ) : (
            /* Floating action pill with on-scroll collapse animation */
            <div
              className={`flex items-center gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)]/95 p-1.5 shadow-xl shadow-black/10 backdrop-blur-md transition-all duration-300 ${
                isScrollingDown
                  ? 'opacity-40 scale-90 translate-y-2 pointer-events-none sm:opacity-80 sm:pointer-events-auto'
                  : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              {/* Contextual Action: Explain Simply (ELI5) */}
              <button
                onClick={() => requestExplanation('eli5')}
                type="button"
                className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-sunken)] px-3 py-2 text-xs font-semibold text-[var(--ink-900)] transition-all hover:bg-[#FF8A00] hover:text-white cursor-pointer active:scale-95"
              >
                <span>Explain Simply</span>
                <span className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.2 text-[10px] font-bold">
                  ELI5
                </span>
              </button>

              {/* Contextual Action: Relatable Analogy */}
              <button
                onClick={() => requestExplanation('analogy')}
                type="button"
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[var(--surface-sunken)] px-3 py-2 text-xs font-semibold text-[var(--ink-900)] transition-all hover:bg-[#0084FE] hover:text-white cursor-pointer active:scale-95"
              >
                <span>Analogy</span>
              </button>

              {/* Open full drawer / Ask button */}
              <button
                onClick={() => {
                  setIsOpen(true);
                  if (!fullBuffer) {
                    requestExplanation('eli5');
                  }
                }}
                type="button"
                className="flex items-center gap-1 rounded-xl bg-[#FF8A00] px-3 py-2 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-95 cursor-pointer"
                title="Open AI Tutor"
              >
                <span>AI Tutor</span>
                <ChevronUp className="size-3.5 stroke-[2.5]" />
              </button>

              {/* Temporary dismiss button */}
              <button
                onClick={() => setIsDismissed(true)}
                type="button"
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--ink-900)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
                title="Hide AI Tutor temporarily"
                aria-label="Dismiss tutor temporarily"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Tutor Slide-over / Modal Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="In-Lesson AI Tutor"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            className="w-full sm:max-w-xl max-h-[88vh] sm:max-h-[82vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 bg-[var(--surface-sunken)]/50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="size-2 rounded-full bg-[#FF8A00]" />
                <div className="min-w-0">
                  <h2 className="text-sm font-extrabold text-[var(--ink-900)] tracking-tight truncate">
                    In-Lesson AI Tutor
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] truncate max-w-xs sm:max-w-md">
                    Context: {stepTitle || topicTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {displayedText && !isStreaming && (
                  <button
                    onClick={() => requestExplanation(activeMode)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--ink-900)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
                    title="Regenerate explanation"
                    type="button"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--ink-900)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
                  title="Close tutor"
                  type="button"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Mode Selection Pills */}
            <div className="flex items-center gap-2 border-b border-[var(--line)] px-5 py-2.5 bg-[var(--surface-card)]">
              <button
                type="button"
                onClick={() => requestExplanation('eli5')}
                disabled={isStreaming}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'eli5'
                    ? 'bg-[#FF8A00] text-white shadow-xs'
                    : 'bg-[var(--surface-sunken)] text-[var(--ink-700)] hover:text-[var(--ink-900)]'
                } disabled:opacity-50`}
              >
                Explain Simply (ELI5)
              </button>

              <button
                type="button"
                onClick={() => requestExplanation('analogy')}
                disabled={isStreaming}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'analogy'
                    ? 'bg-[#0084FE] text-white shadow-xs'
                    : 'bg-[var(--surface-sunken)] text-[var(--ink-700)] hover:text-[var(--ink-900)]'
                } disabled:opacity-50`}
              >
                Relatable Analogy
              </button>
            </div>

            {/* Explanation Content Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[220px]">
              {error ? (
                <div className="rounded-xl border border-red-300/40 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                  {error}
                </div>
              ) : displayedText ? (
                <div className="space-y-2">
                  <MarkdownContent content={displayedText} isStreaming={isStreaming} />
                  <div ref={responseEndRef} />
                </div>
              ) : isStreaming ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 text-[var(--text-muted)]">
                  <div className="size-6 border-2 border-[#FF8A00] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium">DeepSeek tutor is formulating explanation...</p>
                </div>
              ) : (
                <div className="text-center py-10 text-[var(--text-muted)] text-xs">
                  Select a mode above to get an instant explanation.
                </div>
              )}
            </div>

            {/* Custom Follow-Up Input */}
            <form
              onSubmit={handleCustomSubmit}
              className="border-t border-[var(--line)] bg-[var(--surface-sunken)]/60 px-4 py-3"
            >
              <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-card)] px-3 py-2 focus-within:border-[#FF8A00] transition-colors">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Ask any follow-up about this step..."
                  className="flex-1 bg-transparent text-xs text-[var(--ink-900)] placeholder-[var(--text-muted)] outline-none"
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={!customQuestion.trim() || isStreaming}
                  className="flex items-center justify-center size-7 rounded-lg bg-[#FF8A00] text-white transition-all hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Send question"
                >
                  <CornerDownLeft className="size-3.5 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
