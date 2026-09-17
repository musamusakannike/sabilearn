'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronDown,
  CornerDownLeft,
  RotateCcw,
  Heart,
  Sparkles,
  BookOpen,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<ExplanationMode>('eli5');
  const [customQuestion, setCustomQuestion] = useState('');

  // Streaming and typewriter text animation states
  const [fullBuffer, setFullBuffer] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const responseEndRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Progressive typewriter animation effect: smoothly increases displayed characters
  useEffect(() => {
    if (displayedText.length < fullBuffer.length) {
      const remaining = fullBuffer.length - displayedText.length;
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
    <div className="relative" ref={dropdownRef}>
      {/* Hearts / Live Counter + AI Tutor Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all hover:bg-[var(--surface-sunken)] active:scale-95 cursor-pointer text-[var(--ink-900)] select-none"
        title="In-Lesson AI Tutor Options"
      >
        <Heart className="size-5 fill-rose-500 text-rose-500 shrink-0" />
        <span className="text-sm font-extrabold text-[var(--ink-900)]">5</span>
        <ChevronDown
          className={`size-4 text-[var(--ink-900)] transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 z-40 w-60 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-[var(--line)]/60 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[var(--ink-900)]">AI Tutor Assistant</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
              Ask about this step
            </p>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                requestExplanation('eli5');
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[var(--ink-900)] hover:bg-[var(--surface-sunken)] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="size-4 text-[#FF8A00] group-hover:scale-110 transition-transform" />
                <span>Explain Simply</span>
              </div>
              <span className="rounded bg-amber-500/15 dark:bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-[#FF8A00]">
                ELI5
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                requestExplanation('analogy');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--ink-900)] hover:bg-[var(--surface-sunken)] transition-colors text-left group cursor-pointer"
            >
              <MessageSquare className="size-4 text-[#0084FE] group-hover:scale-110 transition-transform" />
              <span>Relatable Analogy</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsOpen(true);
                if (!fullBuffer) {
                  requestExplanation('eli5');
                }
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--ink-900)] hover:bg-[var(--surface-sunken)] transition-colors text-left group cursor-pointer"
            >
              <HelpCircle className="size-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>Ask Custom Question</span>
            </button>
          </div>
        </div>
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
    </div>
  );
}
