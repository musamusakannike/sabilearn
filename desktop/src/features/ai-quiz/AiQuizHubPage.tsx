import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBrain,
  IconFileUpload,
  IconRefresh,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Skeleton } from '@/components/ui';
import { aiApi, courseArchitectApi } from '@/lib/api';
import { AiHistoryItem, CourseArchitectQuota } from '@/lib/types';
import { pickFiles } from '@/platform';
import { useUiStore } from '@/stores/ui.store';

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export function AiQuizHubPage() {
  const navigate = useNavigate();
  const toast = useUiStore((s) => s.toast);

  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(5);
  const [files, setFiles] = useState<File[]>([]);
  const [quota, setQuota] = useState<CourseArchitectQuota | null>(null);
  const [history, setHistory] = useState<AiHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AiHistoryItem | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const load = async () => {
    setLoadingHistory(true);
    try {
      const [hRes, qRes] = await Promise.all([
        aiApi.history({ type: 'quiz', limit: 25 }),
        courseArchitectApi.quota().catch(() => ({ data: null })),
      ]);
      setHistory(hRes.data || []);
      if (qRes.data) setQuota(qRes.data);
    } catch {
      // ignore offline
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addValidatedFiles = (incoming: File[]) => {
    const valid: File[] = [];
    for (const f of incoming) {
      if (f.size > MAX_FILE_BYTES) {
        toast({ title: `${f.name} exceeds 15 MB limit`, variant: 'warning' });
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 6));
  };

  const handleBrowse = async () => {
    const picked = await pickFiles({
      multiple: true,
      title: 'Attach study materials',
      extensions: ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp'],
    });
    addValidatedFiles(picked.map((p) => p.file));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && files.length === 0) || generating) return;
    setGenerating(true);
    setError(null);

    try {
      if (files.length > 0) {
        const form = new FormData();
        if (prompt.trim()) form.append('topic', prompt.trim());
        form.append('count', String(count));
        for (const f of files) {
          form.append('files', f, f.name);
        }
        const res = await aiApi.generateQuizFromMaterials(form);
        const historyId = res.data?.historyId || res.data?._id || res.historyId;
        if (historyId) {
          navigate(`/ai-quiz/${historyId}`);
          return;
        }
      } else {
        const res = await aiApi.generateQuiz(prompt.trim(), count);
        const historyId = res.historyId || res.data?.historyId || res.data?._id;
        if (historyId) {
          navigate(`/ai-quiz/${historyId}`);
          return;
        }
      }
      await load();
      toast({ title: 'Quiz generated!', variant: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quiz generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-[960px] mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">AI Quiz Hub</h1>
          <p className="text-[13.5px] text-[var(--text-tertiary)]">
            Generate practice MCQs from any topic or drag-and-drop PDFs, DOCX notes, and photos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {quota && (
            <Badge variant={quota.isSubscribed ? 'ai' : 'warning'}>
              {quota.isSubscribed
                ? `${quota.remaining}/${quota.dailyLimit} left today`
                : 'Subscriber feature for file uploads'}
            </Badge>
          )}
          <Button variant="secondary" size="sm" icon={<IconRefresh size={15} />} onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card variant="featured">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">
              Topic or instructions
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Pipeline hazards and branch prediction in Computer Architecture..."
              className="w-full p-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[14px] focus:outline-none focus:border-[var(--brand-ai)]"
            />
          </div>

          {/* Drag-and-Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addValidatedFiles(Array.from(e.dataTransfer.files || []));
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
              Drag & drop PDF, DOCX, or photos here (max 15 MB each), or{' '}
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Questions:</span>
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

            <Button
              type="submit"
              variant="ai"
              loading={generating}
              disabled={!prompt.trim() && files.length === 0}
              icon={<IconBrain size={16} />}
            >
              {generating ? 'Generating Quiz...' : 'Generate Quiz'}
            </Button>
          </div>

          {error && (
            <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--danger-bg)] text-[var(--danger)] text-[13px]">
              {error}
            </div>
          )}
        </form>
      </Card>

      {/* Quiz History */}
      <section className="space-y-3">
        <h2 className="text-[16px] font-bold">Recent AI Quizzes</h2>
        {loadingHistory ? (
          <div className="space-y-2.5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            mascot
            title="No AI quizzes yet"
            description="Generate your first practice quiz above."
          />
        ) : (
          <div className="space-y-2.5">
            {history.map((item) => (
              <Card
                key={item._id}
                interactive
                onClick={() => navigate(`/ai-quiz/${item._id}`)}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-bold text-[14.5px] truncate">{item.title || item.prompt}</div>
                  <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                    {Array.isArray(item.result) ? `${item.result.length} questions · ` : ''}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  title="Delete quiz"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(item);
                  }}
                  className="p-2 rounded hover:bg-[var(--danger-bg)] text-[var(--danger)] cursor-pointer shrink-0"
                >
                  <IconTrash size={16} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await aiApi.deleteHistory(deleteTarget._id).catch(() => {});
            setHistory((prev) => prev.filter((h) => h._id !== deleteTarget._id));
          }
          setDeleteTarget(null);
        }}
        title="Delete AI quiz?"
        description="This quiz will be permanently removed from your history."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
