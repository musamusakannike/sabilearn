import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCheck, IconFileUpload, IconLock, IconSparkles, IconX } from '@tabler/icons-react';
import { Badge, Button, Card, Input, ProgressBar } from '@/components/ui';
import { courseArchitectApi, watchCourseArchitectJob } from '@/lib/api';
import { CourseArchitectQuota, GeneratedCourseResult } from '@/lib/types';
import { desktopWindow, pickFiles } from '@/platform';
import { useUiStore } from '@/stores/ui.store';

export function CourseArchitectPage() {
  const navigate = useNavigate();
  const toast = useUiStore((s) => s.toast);

  const [quota, setQuota] = useState<CourseArchitectQuota | null>(null);
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('private');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedCourseResult | null>(null);

  const stopWatchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    courseArchitectApi
      .quota()
      .then((res) => setQuota(res.data || null))
      .catch(() => {});
    return () => {
      stopWatchRef.current?.();
      void desktopWindow.setKeepAwake(false);
    };
  }, []);

  const addFiles = (incoming: File[]) => {
    const valid: File[] = [];
    for (const f of incoming) {
      const limit = f.type.startsWith('image/') ? 20 * 1024 * 1024 : 35 * 1024 * 1024;
      if (f.size > limit) {
        toast({ title: `${f.name} is too large`, variant: 'warning' });
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 8));
  };

  const handleBrowse = async () => {
    const picked = await pickFiles({
      multiple: true,
      title: 'Attach lecture slides or notes',
      extensions: ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp'],
    });
    addFiles(picked.map((p) => p.file));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && files.length === 0) || generating) return;
    setGenerating(true);
    setError(null);
    setProgressPct(10);
    setProgressMsg('Uploading materials & planning curriculum...');
    void desktopWindow.setKeepAwake(true);

    try {
      const form = new FormData();
      if (prompt.trim()) form.append('prompt', prompt.trim());
      if (title.trim()) form.append('title', title.trim());
      form.append('difficulty', difficulty);
      form.append('visibility', visibility);
      for (const f of files) {
        form.append('files', f, f.name);
      }

      const res = await courseArchitectApi.generateFull(form);
      const data: GeneratedCourseResult = res.data || res;

      if (data.jobId && !data.courseId) {
        setProgressPct(25);
        setProgressMsg('Generating chapters and lessons...');
        stopWatchRef.current = watchCourseArchitectJob(data.jobId, {
          onProgress: (ev) => {
            if (typeof ev.percent === 'number') setProgressPct(ev.percent);
            if (ev.message || ev.stage) setProgressMsg(ev.message || ev.stage || 'Generating...');
          },
          onComplete: (ev) => {
            setGenerating(false);
            void desktopWindow.setKeepAwake(false);
            setProgressPct(100);
            setResult({ ...data, courseId: ev.courseId || data.courseId });
          },
          onError: (err) => {
            setGenerating(false);
            void desktopWindow.setKeepAwake(false);
            setError(err.message);
          },
        });
        return;
      }

      setProgressPct(100);
      setResult(data);
      setGenerating(false);
      void desktopWindow.setKeepAwake(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate course.');
      setGenerating(false);
      void desktopWindow.setKeepAwake(false);
    }
  };

  if (result?.courseId) {
    return (
      <div className="max-w-lg mx-auto p-10">
        <Card variant="featured" className="text-center p-7 space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--success-bg)] text-[var(--success)] flex items-center justify-center mx-auto">
            <IconCheck size={30} />
          </div>
          <Badge variant="success">Course Ready</Badge>
          <h1 className="text-[22px] font-bold">{result.title || title || 'Your AI Course'}</h1>
          {result.stats && (
            <p className="text-[13.5px] text-[var(--text-tertiary)]">
              {result.stats.chapters} chapters · {result.stats.topics} lessons generated
            </p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <Button onClick={() => navigate(`/course/${result.courseId}`)}>Open Course</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null);
                setPrompt('');
                setTitle('');
                setFiles([]);
              }}
            >
              Generate Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const gated = quota !== null && !quota.isSubscribed;

  return (
    <div className="max-w-[780px] mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">AI Course Architect</h1>
          <p className="text-[13.5px] text-[var(--text-tertiary)]">
            Turn lecture PDFs, DOCX notes, photos, or a syllabus prompt into an interactive course.
          </p>
        </div>
        {quota && (
          <Badge variant={quota.isSubscribed ? 'ai' : 'warning'}>
            {quota.isSubscribed ? `${quota.remaining}/${quota.dailyLimit} left today` : 'All-Access Required'}
          </Badge>
        )}
      </div>

      {gated && (
        <Card className="p-4 bg-[var(--brand-primary-soft)]/50 border-[var(--brand-primary)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <IconLock size={20} className="shrink-0" />
            <div className="text-[13.5px]">
              <strong>All-Access subscription required</strong> to generate custom AI courses (up to
              5/day).
            </div>
          </div>
          <Button size="sm" onClick={() => navigate('/subscribe')}>
            Subscribe
          </Button>
        </Card>
      )}

      <Card variant="featured">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">
              Course topic or syllabus instructions
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Build a 300L Computer Organization & Architecture course covering pipelining, cache coherence, and RISC-V assembly..."
              className="w-full p-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[14px] focus:outline-none focus:border-[var(--brand-ai)]"
            />
          </div>

          <Input
            label="Optional course title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave blank to let AI name it"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(Array.from(e.dataTransfer.files || []));
            }}
            className={[
              'p-5 rounded-[var(--radius-md)] border-2 border-dashed text-center transition-colors',
              dragOver
                ? 'border-[var(--brand-ai)] bg-[var(--brand-ai-soft)]/50'
                : 'border-[var(--border-default)] bg-[var(--surface-sunken)]/40',
            ].join(' ')}
          >
            <IconFileUpload size={22} className="mx-auto text-[var(--brand-ai)] mb-1.5" />
            <p className="text-[13px] text-[var(--text-secondary)]">
              Drag & drop PDF, DOCX (max 35 MB), or photos (max 20 MB), or{' '}
              <button
                type="button"
                onClick={() => void handleBrowse()}
                className="font-semibold text-[var(--brand-ai)] underline cursor-pointer"
              >
                browse files
              </button>
            </p>
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {files.map((f, idx) => (
                  <span
                    key={`${f.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border-default)] text-[12px]"
                  >
                    {f.name}
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-[var(--text-tertiary)] hover:text-[var(--danger)] cursor-pointer"
                    >
                      <IconX size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">
                Difficulty
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-[var(--radius-sm)] border text-[12.5px] font-semibold capitalize cursor-pointer ${
                      difficulty === d
                        ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)]'
                        : 'border-[var(--border-default)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">
                Visibility
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['private', 'unlisted', 'public'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={`py-2 rounded-[var(--radius-sm)] border text-[12.5px] font-semibold capitalize cursor-pointer ${
                      visibility === v
                        ? 'bg-[var(--brand-ai-soft)] border-[var(--brand-ai)] text-[var(--brand-ai)]'
                        : 'border-[var(--border-default)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {generating && (
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--brand-ai-soft)]/50 space-y-2">
              <div className="flex items-center justify-between text-[13px] font-semibold text-[var(--brand-ai)]">
                <span>{progressMsg || 'Generating course...'}</span>
                <span>{progressPct}%</span>
              </div>
              <ProgressBar value={progressPct} color="var(--brand-ai)" height={7} />
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Your computer will stay awake while generation runs.
              </p>
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
              size="lg"
              loading={generating}
              disabled={gated || (!prompt.trim() && files.length === 0)}
              icon={<IconSparkles size={17} />}
            >
              {generating ? 'Building Course...' : 'Generate Course'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
