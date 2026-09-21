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
} from 'lucide-react';
import { courseArchitectApi } from '@/lib/api';
import { CourseArchitectQuota, GeneratedCourseResult } from '@/lib/types';
import Button from '@/components/ui/Button';

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const VISIBILITIES = ['private', 'unlisted', 'public'] as const;

const STAGES = [
  'Reading your materials…',
  'Outlining chapters…',
  'Writing lessons…',
  'Building quizzes…',
  'Saving your course…',
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
  const [result, setResult] = useState<GeneratedCourseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const stageTimer = useRef<NodeJS.Timeout | null>(null);

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
    };
  }, []);

  const addFiles = (files: FileList | null, kind: 'file' | 'image') => {
    if (!files || files.length === 0) return;
    const newItems: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_BYTES) {
        setError(`${file.name} is over 15MB. Please choose a smaller file.`);
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

  const canGenerate = prompt.trim().length > 0 || attachments.length > 0;

  const startStageLoop = () => {
    setStageIndex(0);
    if (stageTimer.current) clearInterval(stageTimer.current);
    stageTimer.current = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 8000);
  };

  const stopStageLoop = () => {
    if (stageTimer.current) {
      clearInterval(stageTimer.current);
      stageTimer.current = null;
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canGenerate || generating) return;

    setError(null);
    setGenerating(true);
    startStageLoop();

    try {
      const form = new FormData();
      if (title.trim()) form.append('courseTitle', title.trim());
      if (prompt.trim()) form.append('userGuidePrompt', prompt.trim());
      form.append('difficulty', DIFFICULTIES[difficultyIndex]);
      form.append('visibility', VISIBILITIES[visibilityIndex]);

      attachments.forEach((item, index) => {
        form.append(`file_${index}`, item.file);
      });

      const res = await courseArchitectApi.generateFull(form);
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Generation failed');
      }

      setResult(res.data.data as GeneratedCourseResult);
      void loadQuota();
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosError.response?.status;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Something went wrong. Please try again.';

      if (status === 403) {
        setError(message || 'AI Course Generation is an exclusive feature for subscribed members.');
      } else if (status === 401) {
        setError('Sign in to generate a course.');
      } else {
        setError(message);
      }
    } finally {
      stopStageLoop();
      setGenerating(false);
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
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-500)] transition-colors hover:text-[var(--ink-900)] mb-3"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
            Course ready
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Your generated course is saved and you are enrolled.
          </p>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center shadow-xs">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--success-100)] text-[var(--success)]">
            <Check className="size-7 stroke-[3]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--ink-900)] sm:text-2xl">
            {result.title}
          </h2>
          <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">
            {result.stats.chapters} chapters · {result.stats.topics} topics
          </p>
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-500)] transition-colors hover:text-[var(--ink-900)] mb-3"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
          Generate course
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Turn notes or a prompt into a full SabiLearn course.
        </p>
      </div>

      {/* Quota Chip */}
      {quota ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-violet-100)] px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-violet)]">
          <Clock className="size-3.5" />
          <span>
            {quota.remaining} of {quota.dailyLimit} generations left today
          </span>
        </div>
      ) : null}

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Prompt Input */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-900)]">
            What should we teach?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A beginner course on Git for my SWEP class, based on these notes…"
            disabled={generating}
            rows={4}
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 text-base text-[var(--ink-900)] placeholder-[var(--ink-300)] outline-none transition-colors focus:border-[var(--brand-violet)] disabled:opacity-50"
          />
        </div>

        {/* Optional Title Input */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-900)]">
            Optional title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave blank and we’ll name it"
            disabled={generating}
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] px-4 py-3.5 text-base text-[var(--ink-900)] placeholder-[var(--ink-300)] outline-none transition-colors focus:border-[var(--brand-violet)] disabled:opacity-50"
          />
        </div>

        {/* Source Files Upload Area */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-900)]">
            Source files
          </label>

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
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 text-center transition-all hover:bg-[var(--surface-sunken)] active:scale-[0.99] disabled:opacity-50"
            >
              <Upload className="size-5 text-[var(--ink-900)]" />
              <span className="text-xs font-bold text-[var(--ink-900)]">
                PDF or DOCX
              </span>
            </button>

            <button
              type="button"
              disabled={generating}
              onClick={() => photoInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 text-center transition-all hover:bg-[var(--surface-sunken)] active:scale-[0.99] disabled:opacity-50"
            >
              <ImageIcon className="size-5 text-[var(--ink-900)]" />
              <span className="text-xs font-bold text-[var(--ink-900)]">
                Photos
              </span>
            </button>
          </div>

          {/* Attachment Chips List */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-card)] px-3.5 py-2.5 text-xs text-[var(--ink-900)]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {file.kind === 'image' ? (
                      <ImageIcon className="size-4 shrink-0 text-[var(--brand-violet)]" />
                    ) : (
                      <FileText className="size-4 shrink-0 text-[var(--brand-violet)]" />
                    )}
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="shrink-0 text-[var(--text-muted)]">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => removeAttachment(file.id)}
                    className="shrink-0 p-0.5 text-[var(--ink-500)] hover:text-[var(--danger)]"
                    aria-label="Remove attachment"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-900)]">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--surface-sunken)] p-1">
            {['Beginner', 'Intermediate', 'Advanced'].map((level, idx) => (
              <button
                key={level}
                type="button"
                disabled={generating}
                onClick={() => setDifficultyIndex(idx)}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  difficultyIndex === idx
                    ? 'bg-[var(--surface-card)] text-[var(--ink-900)] shadow-xs'
                    : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility Selector */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-900)]">
            Visibility
          </label>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--surface-sunken)] p-1">
            {['Private', 'Unlisted', 'Public'].map((vis, idx) => (
              <button
                key={vis}
                type="button"
                disabled={generating}
                onClick={() => setVisibilityIndex(idx)}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  visibilityIndex === idx
                    ? 'bg-[var(--surface-card)] text-[var(--ink-900)] shadow-xs'
                    : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
                }`}
              >
                {vis}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Private is only for you. Unlisted is link-only. Public can appear in the community catalog.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-[var(--danger-100)] p-4 text-xs font-medium text-[var(--danger)]">
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

        {/* Generating Progress State or Submit Button */}
        {generating ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--brand-violet-100)] bg-[var(--brand-violet-100)]/40 p-5">
            <Loader2 className="size-5 shrink-0 animate-spin text-[var(--brand-violet)] mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--ink-900)]">
                Building your course
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--brand-violet)]">
                {STAGES[stageIndex]}
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Please keep this tab open. This can take a few minutes.
              </p>
            </div>
          </div>
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
