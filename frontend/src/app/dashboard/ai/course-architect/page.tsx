'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Check,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
  Clock,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { courseArchitectApi } from '@/lib/api';
import { CourseArchitectQuota, GeneratedCourseResult } from '@/lib/types';
import Button from '@/components/ui/Button';

// Upload constraints
const MAX_DOC_BYTES = 35 * 1024 * 1024; // 35MB for typed text documents (up to 100 pages)
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB for photos / scanned non-typed files

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const VISIBILITIES = ['private', 'unlisted', 'public'] as const;

const STAGES = [
  'Reading and sanitizing your materials…',
  'Phase 1 Macro: Building Annotated Document Index across all pages…',
  'Phase 1 Macro: Outlining full-coverage course curriculum…',
  'Phase 2 Micro: Grounding lessons with targeted chunk context…',
  'Finalizing interactive quizzes and saving your course…',
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

export default function GenerateCoursePage() {
  const router = useRouter();

  const [quota, setQuota] = useState<CourseArchitectQuota | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [difficultyIndex, setDifficultyIndex] = useState(0);
  const [visibilityIndex, setVisibilityIndex] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(10);
  const [currentStageText, setCurrentStageText] = useState(STAGES[0]);
  const [result, setResult] = useState<GeneratedCourseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Page range selector state
  const [enablePageRange, setEnablePageRange] = useState(false);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const stageTimer = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadQuota = useCallback(async () => {
    try {
      const res = await courseArchitectApi.quota();
      if (res.data?.success) {
        setQuota(res.data.data);
      }
    } catch {
      // offline / unauthenticated
    }
  }, []);

  useEffect(() => {
    void loadQuota();
  }, [loadQuota]);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  const addFiles = (files: FileList | null, kind: 'file' | 'image') => {
    if (!files || files.length === 0) return;
    const newItems: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const maxAllowed = kind === 'image' ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;
      const maxLabel = kind === 'image' ? '20MB' : '35MB';

      if (file.size > maxAllowed) {
        setError(
          `"${file.name}" exceeds the ${maxLabel} limit for ${kind === 'image' ? 'photos' : 'documents'}. Please choose a smaller file${
            kind === 'file' ? ' or use the page range selector.' : '.'
          }`
        );
        return;
      }

      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        kind,
      });
    }

    setAttachments((prev) => [...prev, ...newItems]);
    setError(null);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const hasDocumentAttachment = attachments.some((a) => a.kind === 'file');
  const canGenerate = prompt.trim().length > 0 || attachments.length > 0;

  const startStageLoop = () => {
    setStageIndex(0);
    setProgressPercent(15);
    setCurrentStageText(STAGES[0]);

    if (stageTimer.current) clearInterval(stageTimer.current);
    stageTimer.current = setInterval(() => {
      setStageIndex((prev) => {
        const next = (prev + 1) % STAGES.length;
        setCurrentStageText(STAGES[next]);
        setProgressPercent((p) => Math.min(92, p + 12));
        return next;
      });
    }, 4500);
  };

  const stopStageLoop = () => {
    if (stageTimer.current) {
      clearInterval(stageTimer.current);
      stageTimer.current = null;
    }
  };

  /**
   * Listen to Server-Sent Events (SSE) for background async jobs (> 20 pages).
   */
  const listenToJobProgress = (jobId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sseUrl = courseArchitectApi.getJobProgressUrl(jobId);
    let sseConnected = false;

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        sseConnected = true;
      };

      es.onmessage = (event) => {
        try {
          const job = JSON.parse(event.data);
          if (job.progress !== undefined) {
            setProgressPercent(job.progress);
          }
          if (job.stage) {
            setCurrentStageText(job.stage);
          }

          if (job.status === 'completed' && job.result) {
            es.close();
            stopStageLoop();
            setResult(job.result as GeneratedCourseResult);
            setGenerating(false);
            void loadQuota();
          } else if (job.status === 'failed') {
            es.close();
            stopStageLoop();
            setError(job.error || 'Course generation failed. Please try again.');
            setGenerating(false);
          }
        } catch {
          // ignore parsing error on keepalive
        }
      };

      es.onerror = () => {
        es.close();
        if (!sseConnected) {
          // Fallback to polling if SSE is blocked by client proxy
          startPollingJobStatus(jobId);
        }
      };
    } catch {
      startPollingJobStatus(jobId);
    }
  };

  /**
   * Resilient fallback polling in case SSE is blocked by proxy/firewall.
   */
  const startPollingJobStatus = (jobId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await courseArchitectApi.getJobStatus(jobId);
        if (res.data?.success && res.data.data) {
          const job = res.data.data;
          setProgressPercent(job.progress || 50);
          if (job.stage) setCurrentStageText(job.stage);

          if (job.status === 'completed' && job.result) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            stopStageLoop();
            setResult(job.result as GeneratedCourseResult);
            setGenerating(false);
            void loadQuota();
          } else if (job.status === 'failed') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            stopStageLoop();
            setError(job.error || 'Course generation failed.');
            setGenerating(false);
          }
        }
      } catch {
        // keep polling until timeout
      }
    }, 2500);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canGenerate || generating) return;

    if (quota && !quota.isSubscribed) {
      router.push('/dashboard/subscribe');
      return;
    }

    if (quota && quota.isSubscribed && quota.remaining <= 0) {
      setError('Daily limit reached. Subscribed users are allowed up to 5 AI generations per day.');
      return;
    }

    if (enablePageRange) {
      const s = parseInt(startPage, 10);
      const en = parseInt(endPage, 10);
      if (isNaN(s) || s < 1) {
        setError('Please enter a valid start page number (e.g. 1).');
        return;
      }
      if (endPage.trim() && (isNaN(en) || en < s)) {
        setError(`End page (${endPage}) cannot be less than start page (${startPage}).`);
        return;
      }
    }

    setError(null);
    setGenerating(true);
    startStageLoop();

    try {
      const form = new FormData();
      if (title.trim()) form.append('courseTitle', title.trim());
      if (prompt.trim()) form.append('userGuidePrompt', prompt.trim());
      form.append('difficulty', DIFFICULTIES[difficultyIndex]);
      form.append('visibility', VISIBILITIES[visibilityIndex]);

      if (enablePageRange) {
        if (startPage.trim()) form.append('startPage', startPage.trim());
        if (endPage.trim()) form.append('endPage', endPage.trim());
      }

      attachments.forEach((item, index) => {
        form.append(`file_${index}`, item.file);
      });

      const res = await courseArchitectApi.generateFull(form);

      // Async background queue response for large documents (> 20 pages)
      if (res.data?.async && res.data?.jobId) {
        setCurrentStageText(`Queued background processing for ${res.data.totalPages || 'large'} pages…`);
        listenToJobProgress(res.data.jobId);
        return;
      }

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Generation failed');
      }

      stopStageLoop();
      setResult(res.data.data as GeneratedCourseResult);
      setGenerating(false);
      void loadQuota();
    } catch (err: unknown) {
      stopStageLoop();
      setGenerating(false);
      const axiosError = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosError.response?.status;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Something went wrong. Please try again.';

      if (status === 403) {
        setError(message || 'AI Course Generation is an exclusive feature for subscribed members.');
      } else if (status === 429) {
        setError(message || 'Daily limit reached. Subscribed users are allowed up to 5 AI generations per day.');
      } else if (status === 401) {
        setError('Sign in to generate a course.');
      } else {
        setError(message);
      }
    }
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
    setTitle('');
    setPrompt('');
    setAttachments([]);
    setDifficultyIndex(0);
    setVisibilityIndex(0);
    setEnablePageRange(false);
    setStartPage('');
    setEndPage('');
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--ink-500) transition-colors hover:text-foreground mb-3"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Course ready
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            Your generated course has been structured with 100% material coverage and saved.
          </p>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-(--line) bg-(--surface-card) p-8 text-center shadow-xs">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-(--success-100) text-(--success)">
            <Check className="size-7 stroke-3" />
          </div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            {result.title}
          </h2>
          <p className="mt-2 text-sm font-medium text-(--text-muted)">
            {result.stats.chapters} chapters · {result.stats.topics} topics
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-(--brand-violet-100) px-3 py-1 text-xs font-semibold text-(--brand-violet)">
            <CheckCircle2 className="size-3.5" />
            <span>Guaranteed full document coverage</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            fullWidth
            variant="ai"
            size="lg"
            onClick={() => router.push(`/dashboard/courses/${result.courseId}`)}
          >
            Open course
          </Button>
          <Button fullWidth variant="secondary" size="md" onClick={resetForm}>
            Generate another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--ink-500) transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Generate course
        </h1>
        <p className="mt-1 text-sm text-(--text-muted)">
          Turn notes, slides, or syllabus into a full SabiLearn course with comprehensive coverage.
        </p>
      </div>

      {/* Quota / Subscription Banner */}
      {quota ? (
        !quota.isSubscribed ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-(--brand-violet-200) bg-(--brand-violet-100)/40 p-4 text-xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="size-4 shrink-0 text-(--brand-violet) mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Subscription Required</p>
                <p className="text-(--text-muted) mt-0.5">
                  AI Course Generation is an exclusive feature for SabiLearn subscribers.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/subscribe"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-(--brand-violet) px-3.5 py-2 font-bold text-white shadow-xs transition hover:opacity-95"
            >
              Subscribe to unlock
            </Link>
          </div>
        ) : quota.remaining <= 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-(--warning-200) bg-(--warning-100)/60 px-3.5 py-2.5 text-xs font-medium text-(--warning-800)">
            <Clock className="size-4 shrink-0" />
            <span>
              Daily limit reached ({quota.dailyLimit} of {quota.dailyLimit} generations used today). Resets at midnight UTC.
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-(--brand-violet-100) px-3.5 py-1.5 text-xs font-semibold text-(--brand-violet)">
            <Clock className="size-3.5" />
            <span>
              {quota.remaining} of {quota.dailyLimit} generations left today
            </span>
          </div>
        )
      ) : null}

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Prompt Input */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground">
            What should we teach?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A beginner course on Git for my SWEP class, based on these notes…"
            disabled={generating}
            rows={4}
            className="w-full rounded-2xl border border-(--line) bg-(--surface-card) p-4 text-base text-foreground placeholder-(--ink-300) outline-none transition-colors focus:border-(--brand-violet) disabled:opacity-50"
          />
        </div>

        {/* Optional Title Input */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground">
            Optional title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave blank and we’ll name it"
            disabled={generating}
            className="w-full rounded-2xl border border-(--line) bg-(--surface-card) px-4 py-3.5 text-base text-foreground placeholder-(--ink-300) outline-none transition-colors focus:border-(--brand-violet) disabled:opacity-50"
          />
        </div>

        {/* Source Files Upload Area */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
              Source files
            </label>
            <span className="text-[11px] font-medium text-(--text-muted)">
              Up to 100 pages typed · Max 35MB
            </span>
          </div>

          {/* Hidden HTML file inputs */}
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
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-(--line) bg-(--surface-card) p-4 text-center transition-all hover:border-(--brand-violet) hover:bg-(--surface-sunken) active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-(--brand-violet-100) text-(--brand-violet) transition group-hover:scale-105">
                <Upload className="size-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-foreground">
                  PDF or DOCX
                </span>
                <span className="block text-[11px] text-(--text-muted) mt-0.5">
                  Up to 100 pages (max 35MB)
                </span>
              </div>
            </button>

            <button
              type="button"
              disabled={generating}
              onClick={() => photoInputRef.current?.click()}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-(--line) bg-(--surface-card) p-4 text-center transition-all hover:border-(--brand-violet) hover:bg-(--surface-sunken) active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-(--brand-violet-100) text-(--brand-violet) transition group-hover:scale-105">
                <ImageIcon className="size-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-foreground">
                  Photos & Slides
                </span>
                <span className="block text-[11px] text-(--text-muted) mt-0.5">
                  Max 20MB (auto-optimized)
                </span>
              </div>
            </button>
          </div>

          {/* Attachment Chips List */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-(--line) bg-(--surface-card) px-3.5 py-2.5 text-xs text-foreground transition hover:border-(--brand-violet-200)"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {file.kind === 'image' ? (
                      <ImageIcon className="size-4 shrink-0 text-(--brand-violet)" />
                    ) : (
                      <FileText className="size-4 shrink-0 text-(--brand-violet)" />
                    )}
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="shrink-0 text-(--text-muted)">
                      ({formatFileSize(file.size)})
                    </span>
                    <span className="rounded bg-(--surface-sunken) px-1.5 py-0.5 text-[10px] font-semibold uppercase text-(--ink-500)">
                      {file.kind === 'image' ? 'Image' : 'Document'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => removeAttachment(file.id)}
                    className="shrink-0 p-0.5 text-(--ink-500) transition hover:text-(--danger)"
                    aria-label="Remove attachment"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Page Range Selector (for document uploads) */}
          {hasDocumentAttachment && (
            <div className="mt-4 rounded-2xl border border-(--line) bg-(--surface-card) p-4 transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-(--brand-violet)" />
                  <span className="text-xs font-bold text-foreground">
                    Targeted Page Range
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnablePageRange(!enablePageRange)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    enablePageRange
                      ? 'bg-(--brand-violet-100) text-(--brand-violet)'
                      : 'text-(--ink-500) hover:text-foreground hover:bg-(--surface-sunken)'
                  }`}
                >
                  {enablePageRange ? 'Using Custom Range' : '+ Specify Pages'}
                </button>
              </div>

              {enablePageRange ? (
                <div className="mt-3 space-y-2.5 pt-2 border-t border-(--line)">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-(--ink-500) mb-1">
                        Start Page
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 1"
                        value={startPage}
                        onChange={(e) => setStartPage(e.target.value)}
                        disabled={generating}
                        className="w-full rounded-xl border border-(--line) bg-(--surface-sunken) px-3 py-2 text-xs text-foreground outline-none focus:border-(--brand-violet)"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-(--ink-500) mb-1">
                        End Page
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 25"
                        value={endPage}
                        onChange={(e) => setEndPage(e.target.value)}
                        disabled={generating}
                        className="w-full rounded-xl border border-(--line) bg-(--surface-sunken) px-3 py-2 text-xs text-foreground outline-none focus:border-(--brand-violet)"
                      />
                    </div>
                  </div>

                  {/* Clarification prompt requested by user */}
                  <div className="flex items-start gap-2 rounded-xl bg-(--brand-violet-100)/50 p-2.5 text-[11px] text-(--brand-violet-hover) font-medium">
                    <Info className="size-3.5 shrink-0 mt-0.5 text-(--brand-violet)" />
                    <span>
                      The more specific you are with your page range, the better the result.
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] text-(--text-muted)">
                  We’ll analyze up to 100 pages. To extract a specific chapter or lecture, click “+ Specify Pages”.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-(--surface-sunken) p-1">
            {['Beginner', 'Intermediate', 'Advanced'].map((level, idx) => (
              <button
                key={level}
                type="button"
                disabled={generating}
                onClick={() => setDifficultyIndex(idx)}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  difficultyIndex === idx
                    ? 'bg-(--surface-card) text-foreground shadow-xs'
                    : 'text-(--ink-500) hover:text-foreground'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility Selector */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground">
            Visibility
          </label>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-(--surface-sunken) p-1">
            {['Private', 'Unlisted', 'Public'].map((vis, idx) => (
              <button
                key={vis}
                type="button"
                disabled={generating}
                onClick={() => setVisibilityIndex(idx)}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  visibilityIndex === idx
                    ? 'bg-(--surface-card) text-foreground shadow-xs'
                    : 'text-(--ink-500) hover:text-foreground'
                }`}
              >
                {vis}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-(--text-muted)">
            Private is only for you. Unlisted is link-only. Public can appear in the community catalog.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-(--danger-100) p-4 text-xs font-medium text-(--danger)">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              {error.toLowerCase().includes('subscri') && (
                <div className="mt-2">
                  <Link
                    href="/dashboard/subscribe"
                    className="font-bold underline hover:opacity-90"
                  >
                    View subscription plans
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generating Progress State with Real-Time Progress Bar & SSE Stages */}
        {generating ? (
          <div className="rounded-2xl border border-(--brand-violet-200) bg-(--surface-card) p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Loader2 className="size-5 shrink-0 animate-spin text-(--brand-violet) mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Architecting your course
                  </p>
                  <p className="text-xs font-semibold text-(--brand-violet) mt-0.5 transition-all">
                    {currentStageText}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-(--brand-violet) tabular-nums">
                {progressPercent}%
              </span>
            </div>

            {/* Dynamic Animated Progress Bar */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-(--surface-sunken)">
              <div
                className="h-full rounded-full bg-linear-to-r from-(--brand-violet) to-(--brand-violet-hover) transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-(--text-muted) pt-1">
              <span>Hierarchical 2-Phase Map-Reduce</span>
              <span>100% full document coverage</span>
            </div>
          </div>
        ) : quota && !quota.isSubscribed ? (
          <Link href="/dashboard/subscribe" className="block w-full">
            <Button
              type="button"
              fullWidth
              variant="ai"
              size="lg"
              className="flex items-center justify-center gap-2"
            >
              <Sparkles className="size-4" />
              <span>Subscribe to unlock course generation</span>
            </Button>
          </Link>
        ) : quota && quota.isSubscribed && quota.remaining <= 0 ? (
          <Button
            type="button"
            fullWidth
            variant="secondary"
            size="lg"
            disabled
            className="flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
          >
            <Clock className="size-4" />
            <span>Daily limit reached (0/{quota.dailyLimit} remaining)</span>
          </Button>
        ) : (
          <Button
            type="submit"
            fullWidth
            variant="ai"
            size="lg"
            disabled={!canGenerate}
            className="flex items-center justify-center gap-2"
          >
            <BookOpen className="size-4" />
            <span>Generate course</span>
          </Button>
        )}
      </form>
    </div>
  );
}
