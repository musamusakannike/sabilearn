'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Brain,
  Loader2,
  Play,
  Trash2,
  Calendar,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Clock,
} from 'lucide-react';
import { aiApi, courseArchitectApi } from '@/lib/api';
import { AiHistoryItem, CourseArchitectQuota } from '@/lib/types';
import Button from '@/components/ui/Button';

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const STAGES = [
  'Reading your materials',
  'Drafting questions',
  'Checking answers',
  'Saving your quiz',
];

interface Attachment {
  id: string;
  file: File;
  name: string;
  size: number;
  kind: 'file' | 'image';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AIQuizHubPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState<number>(5);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [quota, setQuota] = useState<CourseArchitectQuota | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [historyItems, setHistoryItems] = useState<AiHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setHistoryError(null);
      const res = await aiApi.history({ type: 'quiz', limit: 20 });
      if (res.data?.success) {
        setHistoryItems(res.data.data || []);
      } else {
        setHistoryError('Failed to load quiz history.');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setHistoryError(message || 'Error fetching quiz history.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadQuota = useCallback(async () => {
    try {
      const res = await courseArchitectApi.quota();
      if (res.data?.success) setQuota(res.data.data);
    } catch {
      // unauthenticated or offline
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
    void loadQuota();
  }, [fetchHistory, loadQuota]);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, []);

  const addFiles = (files: FileList | null, kind: 'file' | 'image') => {
    if (!files || files.length === 0) return;
    const next: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_BYTES) {
        setError(`${file.name} is over 15MB. Please choose a smaller file.`);
        return;
      }
      next.push({
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        kind,
      });
    }
    setAttachments((prev) => [...prev, ...next]);
    setError(null);
  };

  const canGenerate = topic.trim().length > 0 || attachments.length > 0;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGenerate || generating) return;

    if (quota && !quota.isSubscribed) {
      router.push('/dashboard/subscribe');
      return;
    }
    if (quota && quota.isSubscribed && quota.remaining <= 0) {
      setError('Daily limit reached. Subscribed users are allowed up to 5 AI generations per day.');
      return;
    }

    setError(null);
    setGenerating(true);
    setStageIndex(0);
    if (stageTimer.current) clearInterval(stageTimer.current);
    stageTimer.current = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 1500);

    try {
      const form = new FormData();
      if (topic.trim()) form.append('topic', topic.trim());
      form.append('count', String(count));
      attachments.forEach((item, index) => {
        form.append(`file_${index}`, item.file);
      });

      const res = await aiApi.generateQuizFromMaterials(form);
      if (res.data?.success && res.data?.data?.historyId) {
        void loadQuota();
        router.push(`/dashboard/ai/quiz/${res.data.data.historyId}`);
        return;
      }
      setError('Quiz generation failed. Please try again.');
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || axiosError.message || 'Failed to generate quiz. Please try again.';
      if (status === 403) {
        setError(message);
      } else if (status === 429) {
        setError(message);
        void loadQuota();
      } else {
        setError(message);
      }
    } finally {
      if (stageTimer.current) clearInterval(stageTimer.current);
      setGenerating(false);
    }
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this quiz history?')) return;

    try {
      await aiApi.deleteHistory(id);
      setHistoryItems((prev) => prev.filter((item) => item._id !== id));
    } catch {
      alert('Failed to delete quiz history.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
          Generate quiz
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Turn a prompt, notes, or photos into a multiple-choice quiz. Courses and quizzes share the same daily limit.
        </p>
      </div>

      <div className="max-w-2xl space-y-6 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-xs sm:p-8">
        {quota ? (
          !quota.isSubscribed ? (
            <div className="flex flex-col items-start justify-between gap-3.5 rounded-2xl border border-[var(--brand-violet-200)] bg-[var(--brand-violet-100)]/40 p-4 text-xs sm:flex-row sm:items-center">
              <div className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--brand-violet)]" />
                <div>
                  <p className="font-bold text-[var(--ink-900)]">Subscription required</p>
                  <p className="mt-0.5 text-[var(--text-muted)]">
                    Quiz generation from notes is included with SabiLearn.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/subscribe"
                className="inline-flex shrink-0 items-center rounded-xl bg-[var(--brand-violet)] px-3.5 py-2 font-bold text-white"
              >
                Subscribe to unlock
              </Link>
            </div>
          ) : quota.remaining <= 0 ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--warning-200)] bg-[var(--warning-100)]/60 px-3.5 py-2.5 text-xs font-medium text-[var(--warning-800)]">
              <Clock className="size-4 shrink-0" />
              <span>
                Daily limit reached ({quota.dailyLimit} of {quota.dailyLimit} generations used today). Resets at midnight UTC.
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-violet-100)] px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-violet)]">
              <Clock className="size-3.5" />
              <span>
                {quota.remaining} of {quota.dailyLimit} generations left today
              </span>
            </div>
          )
        ) : null}

        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-900)]">
              What should the quiz cover?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Optional if you attach notes. e.g. Chapter 4, focus on definitions."
              rows={4}
              disabled={generating}
              className="w-full rounded-2xl border border-[var(--line)] bg-background p-4 text-sm text-foreground placeholder-[var(--ink-300)] outline-none transition-colors focus:border-[var(--brand-violet)] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-900)]">
              Number of questions
            </label>
            <div className="flex items-center gap-2">
              {[3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  disabled={generating}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    count === num
                      ? 'bg-[var(--brand-violet)] text-white shadow-xs'
                      : 'bg-[var(--surface-sunken)] text-[var(--ink-700)] hover:bg-[var(--line)]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-900)]">
              Source files
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files, 'file');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            <input
              ref={photoInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files, 'image');
                if (photoInputRef.current) photoInputRef.current.value = '';
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={generating}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-background p-4 text-center transition-all hover:bg-[var(--surface-sunken)] disabled:opacity-50"
              >
                <Upload className="size-5" />
                <span className="text-xs font-bold">PDF or DOCX</span>
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={() => photoInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-background p-4 text-center transition-all hover:bg-[var(--surface-sunken)] disabled:opacity-50"
              >
                <ImageIcon className="size-5" />
                <span className="text-xs font-bold">Photos</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Up to 15MB total, 15 images, and 20 PDF pages. PDF, DOCX, and photos only.
            </p>
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {file.kind === 'image' ? (
                        <ImageIcon className="size-4 shrink-0 text-[var(--brand-violet)]" />
                      ) : (
                        <FileText className="size-4 shrink-0 text-[var(--brand-violet)]" />
                      )}
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="shrink-0 text-[var(--text-muted)]">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== file.id))}
                      aria-label="Remove attachment"
                      className="text-[var(--ink-500)] hover:text-[var(--danger)]"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-[var(--danger-100)] p-4 text-xs font-medium text-[var(--danger)]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <span>{error}</span>
                {error.toLowerCase().includes('subscri') && (
                  <div className="mt-2">
                    <Link href="/dashboard/subscribe" className="font-bold underline">
                      View subscription plans
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {generating ? (
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--brand-violet-100)] bg-[var(--brand-violet-100)]/40 p-5">
              <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-[var(--brand-violet)]" />
              <div>
                <p className="text-sm font-bold text-[var(--ink-900)]">Building your quiz</p>
                <p className="mt-1 text-xs font-semibold text-[var(--brand-violet)]">{STAGES[stageIndex]}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Questions are written from your prompt and files.
                </p>
              </div>
            </div>
          ) : quota && !quota.isSubscribed ? (
            <Link href="/dashboard/subscribe" className="block">
              <Button type="button" fullWidth variant="ai" size="lg">
                Subscribe to generate a quiz
              </Button>
            </Link>
          ) : quota && quota.isSubscribed && quota.remaining <= 0 ? (
            <Button type="button" fullWidth variant="secondary" size="lg" disabled>
              Daily limit reached
            </Button>
          ) : (
            <Button type="submit" fullWidth variant="ai" size="lg" disabled={!canGenerate}>
              Generate quiz
            </Button>
          )}
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Quiz history</h2>
            <span className="rounded-full bg-(--surface-sunken) px-2.5 py-0.5 text-xs font-semibold text-(--ink-700)">
              {historyItems.length}
            </span>
          </div>
          <button
            onClick={fetchHistory}
            disabled={loadingHistory}
            className="flex items-center gap-1.5 text-xs font-medium text-(--ink-500) transition-colors hover:text-(--brand-violet)"
          >
            <RefreshCw className={`size-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loadingHistory ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-(--surface-sunken)" />
            ))}
          </div>
        ) : historyError ? (
          <div className="space-y-2 rounded-lg border border-(--line) bg-(--surface-card) p-6 text-center text-(--ink-500)">
            <p className="text-sm text-(--danger)">{historyError}</p>
            <button onClick={fetchHistory} className="text-xs font-semibold text-(--brand-violet) underline">
              Try again
            </button>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-(--line) bg-(--surface-card) p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-(--brand-violet-100) text-(--brand-violet)">
              <Brain className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No quizzes yet</h3>
            <p className="mx-auto max-w-sm text-sm text-(--ink-500)">
              Add a topic or attach notes to create your first quiz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {historyItems.map((item) => {
              const questionCount = Array.isArray(item.result)
                ? item.result.length
                : (item.metadata as { count?: number } | undefined)?.count || 0;
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={item._id}
                  className="group relative flex flex-col justify-between rounded-lg border border-(--line) bg-(--surface-card) p-5 transition-all hover:border-(--brand-violet) hover:shadow-(--shadow-md)"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate rounded-full bg-(--brand-violet-100) px-2.5 py-0.5 text-xs font-semibold text-(--brand-violet-600)">
                        {item.prompt || 'Notes'}
                      </span>
                      <button
                        onClick={(e) => handleDeleteHistory(item._id, e)}
                        className="rounded-md p-1 text-(--ink-300) transition-colors hover:text-(--danger)"
                        title="Delete quiz"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <h3 className="line-clamp-2 text-base font-bold text-foreground transition-colors group-hover:text-(--brand-violet)">
                      {item.title || `Quiz: ${item.prompt}`}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-(--ink-500)">
                      <div className="flex items-center gap-1">
                        <HelpCircle className="size-3.5" />
                        <span>{questionCount} questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end border-t border-(--line) pt-4">
                    <Link
                      href={`/dashboard/ai/quiz/${item._id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--brand-violet)"
                    >
                      <Play className="size-3.5 fill-current" />
                      Take quiz
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
