'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Copy,
  Pencil,
  Check,
  X,
  SplitSquareHorizontal,
  Monitor,
  Terminal,
  Save,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePlaygroundStore } from '@/store/playground.store';
import { WEB_FILES, PYTHON_FILES, STARTERS, defaultFiles, fileLanguage } from '@/lib/playground/templates';
import FileTabs from '@/components/playground/FileTabs';
import FileExplorer from '@/components/playground/FileExplorer';
import MonacoEditor from '@/components/playground/MonacoEditor';
import WebPreview from '@/components/playground/WebPreview';
import PythonConsole from '@/components/playground/PythonConsole';
import PyodideRunner, { PyodideRunnerHandle } from '@/components/playground/PyodideRunner';

type PaneMode = 'preview' | 'console';

export default function PlaygroundIdePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const pyodideRef = useRef<PyodideRunnerHandle>(null);

  const { projects, hydrate, hydrated, updateProject, deleteProject, duplicateProject, syncNow } = usePlaygroundStore();

  const project = useMemo(() => projects.find((p) => p.localId === id), [projects, id]);

  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState('index.html');
  const [paneMode, setPaneMode] = useState<PaneMode>('preview');
  const [mobileTab, setMobileTab] = useState<'code' | 'output'>('code');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [running, setRunning] = useState(false);
  const [pyStatus, setPyStatus] = useState('Ready');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'pending'>('saved');
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorSplit, setEditorSplit] = useState(56); // percent for editor pane on desktop
  const draggingRef = useRef(false);

  const filesRef = useRef<Record<string, string>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate if not yet
  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrate, hydrated]);

  // init from project
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!project) return;
    setFiles(project.files);
    filesRef.current = project.files;
    setActiveFile(project.kind === 'python' ? 'main.py' : 'index.html');
    setRenameValue(project.name);
    setPaneMode(project.kind === 'python' ? 'console' : 'preview');
    setPyStatus('Ready');
  }, [project]);

  // if project missing after hydrate, redirect
  useEffect(() => {
    if (hydrated && !project) {
      toast.error('Project not found');
      router.replace('/dashboard/playground');
    }
  }, [hydrated, project, router]);

  const fileList = useMemo(() => {
    if (!project) return WEB_FILES.slice() as unknown as string[];
    return project.kind === 'python' ? ([...PYTHON_FILES] as unknown as string[]) : ([...WEB_FILES] as unknown as string[]);
  }, [project]);

  const persist = useCallback(
    (nextFiles: Record<string, string>, name?: string) => {
      if (!id) return;
      setSaveStatus('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void updateProject(id, { files: nextFiles, ...(name ? { name } : {}) });
        setSaveStatus('pending');
        // after a moment show saved
        setTimeout(() => setSaveStatus('saved'), 400);
      }, 700);
    },
    [id, updateProject]
  );

  // cleanup on unmount: flush pending save and sync
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (id) {
        void usePlaygroundStore.getState().updateProject(id, { files: filesRef.current });
        void usePlaygroundStore.getState().syncNow();
      }
    };
  }, [id]);

  const onChangeCode = (value: string) => {
    const next = { ...filesRef.current, [activeFile]: value };
    filesRef.current = next;
    setFiles(next);
    persist(next);
  };

  const run = useCallback(() => {
    if (!project) return;
    if (project.kind === 'python') {
      setRunning(true);
      setStdout('');
      setStderr('');
      setPyStatus('Running…');
      setPaneMode('console');
      setMobileTab('output');
      pyodideRef.current?.run(files['main.py'] || '');
    } else {
      setPaneMode('preview');
      setMobileTab('output');
      toast.success('Preview updated');
    }
  }, [project, files]);

  // Keyboard shortcut run
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (id) {
          void updateProject(id, { files: filesRef.current });
          toast.success('Saved');
          setSaveStatus('saved');
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [run, id, updateProject]);

  const resetFile = (file: string) => {
    const starter = STARTERS[file] ?? (defaultFiles(project?.kind || 'web')[file] || '');
    const next = { ...filesRef.current, [file]: starter };
    filesRef.current = next;
    setFiles(next);
    persist(next);
    toast.success(`Reset ${file}`);
  };

  const handleRename = () => {
    const next = renameValue.trim();
    if (!next || !id || !project) return;
    void updateProject(id, { name: next });
    void syncNow();
    setRenameOpen(false);
    toast.success('Renamed project');
  };

  // Draggable split
  const onSplitMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    const startX = e.clientX;
    const startSplit = editorSplit;
    const container = (e.currentTarget.parentElement as HTMLElement) ?? null;
    const rect = container?.getBoundingClientRect();
    const total = rect?.width || 1000;

    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = ev.clientX - startX;
      const deltaPct = (dx / total) * 100;
      const next = Math.min(78, Math.max(32, startSplit + deltaPct));
      setEditorSplit(next);
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!project) {
    return (
      <div className="-mx-6 flex h-[calc(100vh-5rem)] items-center justify-center lg:-mx-10">
        <div className="flex flex-col items-center gap-3 text-[var(--ink-500)]">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-sm">Loading project…</span>
        </div>
      </div>
    );
  }

  const language = fileLanguage(activeFile);
  const isPython = project.kind === 'python';

  return (
    <div className="-mx-6 -my-8 flex h-[calc(100vh-5rem)] flex-col bg-[var(--surface-page)] lg:-mx-10 lg:-my-10 lg:h-[calc(100vh-5rem)]">
      {/* Top bar */}
      <div className="flex shrink-0 flex-col border-b border-[var(--line)] bg-[var(--surface-card)]">
        <div className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5">
          <button
            onClick={() => router.push('/dashboard/playground')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--surface-sunken)]"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Library</span>
          </button>

          <div className="mx-2 hidden h-6 w-px bg-[var(--line)] lg:block" />

          <button
            onClick={() => setExplorerOpen((v) => !v)}
            className="hidden rounded p-1.5 text-[var(--ink-500)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)] lg:inline-flex"
            title={explorerOpen ? 'Hide explorer' : 'Show explorer'}
          >
            {explorerOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
          </button>

          {/* Title */}
          <div className="min-w-0 flex-1 lg:max-w-[320px]">
            <button
              onClick={() => setRenameOpen(true)}
              className="group flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2 py-1 text-left hover:bg-[var(--surface-sunken)]"
            >
              <span className="truncate text-sm font-semibold text-[var(--ink-900)]">{project.name}</span>
              <Pencil className="hidden size-3 shrink-0 text-[var(--ink-300)] group-hover:inline" />
              <span
                className={`ml-1 hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ring-1 lg:inline-flex ${
                  isPython
                    ? 'bg-amber-50 text-amber-700 ring-amber-100'
                    : 'bg-[var(--brand-violet-100)] text-[var(--brand-violet-600)] ring-[var(--brand-violet-100)]'
                }`}
              >
                {isPython ? 'Python' : 'Web'}
              </span>
            </button>
          </div>

          {/* Save / sync status - desktop */}
          <div className="hidden items-center gap-2 lg:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-sunken)]/50 px-2.5 py-1 text-xs text-[var(--ink-500)]">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> Saving…
                </>
              ) : saveStatus === 'pending' ? (
                <>
                  <Cloud className="size-3" /> Sync pending
                </>
              ) : (
                <>
                  <Check className="size-3 text-emerald-600" /> Saved locally
                </>
              )}
            </span>
            {project.syncState === 'synced' ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <Cloud className="size-3" /> Synced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <CloudOff className="size-3" /> Local
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Mobile code/output switch */}
            <div className="inline-flex rounded-full bg-[var(--surface-sunken)] p-1 lg:hidden">
              <button
                onClick={() => setMobileTab('code')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mobileTab === 'code' ? 'bg-white shadow text-[var(--ink-900)]' : 'text-[var(--ink-500)]'}`}
              >
                Code
              </button>
              <button
                onClick={() => setMobileTab('output')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mobileTab === 'output' ? 'bg-white shadow text-[var(--ink-900)]' : 'text-[var(--ink-500)]'}`}
              >
                {isPython ? 'Console' : 'Preview'}
              </button>
            </div>

            <button
              onClick={() => resetFile(activeFile)}
              className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--surface-sunken)] lg:inline-flex"
              title="Reset current file"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full p-2 text-[var(--ink-500)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)]"
                aria-label="More"
              >
                <MoreHorizontal className="size-5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-white p-1 shadow-[var(--shadow-md)]">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setRenameOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm hover:bg-[var(--surface-sunken)]"
                    >
                      <Pencil className="size-4" /> Rename
                    </button>
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        const copy = await duplicateProject(id);
                        if (copy) {
                          toast.success('Duplicated');
                          router.push(`/dashboard/playground/${copy.localId}`);
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm hover:bg-[var(--surface-sunken)]"
                    >
                      <Copy className="size-4" /> Duplicate
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        resetFile(activeFile);
                      }}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm hover:bg-[var(--surface-sunken)]"
                    >
                      <RotateCcw className="size-4" /> Reset this file
                    </button>
                    <div className="my-1 h-px bg-[var(--line)]" />
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        const ok = window.confirm(`Delete “${project.name}”?`);
                        if (!ok) return;
                        await deleteProject(id);
                        toast.success('Deleted');
                        router.replace('/dashboard/playground');
                      }}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger-100)]"
                    >
                      <Trash2 className="size-4" /> Delete project
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={run}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-gold)] px-4 py-2 text-sm font-semibold text-[var(--ink-900)] shadow-[var(--shadow-xs)] hover:bg-[var(--brand-gold-600)] disabled:opacity-50"
              disabled={running}
            >
              {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}
              Run
              <span className="hidden text-xs font-medium opacity-60 lg:inline">Ctrl+Enter</span>
            </button>
          </div>
        </div>

        <FileTabs files={fileList} active={activeFile} onChange={setActiveFile} />
      </div>

      {/* Workspace */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Explorer - desktop */}
        {explorerOpen && (
          <div className="hidden w-[220px] shrink-0 lg:block">
            <FileExplorer kind={project.kind} files={fileList} active={activeFile} onSelect={setActiveFile} onResetFile={resetFile} />
          </div>
        )}

        {/* Editor + Preview split */}
        {/* Mobile: stacked with tab switch */}
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          {mobileTab === 'code' ? (
            <div className="min-h-0 flex-1">
              <MonacoEditor file={activeFile} language={language} value={files[activeFile] || ''} onChange={onChangeCode} onRun={run} />
            </div>
          ) : (
            <div className="min-h-0 flex-1 p-2">
              {isPython ? (
                <PythonConsole
                  stdout={stdout}
                  stderr={stderr}
                  status={pyStatus}
                  running={running}
                  onClear={() => {
                    setStdout('');
                    setStderr('');
                  }}
                />
              ) : (
                <WebPreview html={files['index.html'] || ''} css={files['styles.css'] || ''} js={files['script.js'] || ''} />
              )}
            </div>
          )}
          {/* mini status bar mobile */}
          <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--surface-card)] px-3 py-1.5 text-[11px] text-[var(--ink-400)]">
            <span>{activeFile}</span>
            <span className="inline-flex items-center gap-1">
              {saveStatus === 'saving' ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
              {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving…' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Desktop split */}
        <div className="hidden min-h-0 flex-1 lg:flex">
          <div className="flex min-h-0 flex-1" style={{}}>
            {/* Editor */}
            <div className="flex min-h-0 flex-col border-r border-[var(--line)] bg-white" style={{ width: `${editorSplit}%` }}>
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-sunken)]/30 px-3 py-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-500)]">
                  <SplitSquareHorizontal className="size-3.5" />
                  Editor
                </span>
                <span className="text-[11px] text-[var(--ink-300)]">{isPython ? 'Python' : 'Web'} · Ctrl+S to save</span>
              </div>
              <div className="min-h-0 flex-1">
                <MonacoEditor file={activeFile} language={language} value={files[activeFile] || ''} onChange={onChangeCode} onRun={run} />
              </div>
            </div>

            {/* Drag handle */}
            <div
              onMouseDown={onSplitMouseDown}
              className="flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-[var(--surface-sunken)] hover:bg-[var(--line-strong)]"
              title="Drag to resize"
            >
              <div className="h-8 w-0.5 rounded-full bg-[var(--line-strong)]" />
            </div>

            {/* Output */}
            <div className="flex min-h-0 flex-1 flex-col bg-[var(--surface-sunken)]/20">
              <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface-card)] px-2 py-1">
                <div className="inline-flex rounded-full bg-[var(--surface-sunken)] p-1">
                  {!isPython && (
                    <button
                      onClick={() => setPaneMode('preview')}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${paneMode === 'preview' ? 'bg-white shadow text-[var(--ink-900)]' : 'text-[var(--ink-500)]'}`}
                    >
                      <Monitor className="size-3.5" /> Preview
                    </button>
                  )}
                  <button
                    onClick={() => setPaneMode(isPython ? 'console' : 'console')}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${paneMode === 'console' ? 'bg-white shadow text-[var(--ink-900)]' : 'text-[var(--ink-500)]'}`}
                  >
                    <Terminal className="size-3.5" /> {isPython ? 'Console' : 'Console'}
                  </button>
                </div>
                {!isPython && paneMode === 'preview' && (
                  <span className="ml-auto text-xs text-emerald-600">Live preview</span>
                )}
                {isPython && (
                  <span className={`ml-auto text-xs ${running ? 'text-amber-600' : stderr ? 'text-[var(--danger)]' : 'text-[var(--ink-500)]'}`}>
                    {running ? 'Running…' : pyStatus}
                  </span>
                )}
              </div>

              <div className="min-h-0 flex-1 p-2">
                {isPython ? (
                  <PythonConsole
                    stdout={stdout}
                    stderr={stderr}
                    status={pyStatus}
                    running={running}
                    onClear={() => {
                      setStdout('');
                      setStderr('');
                    }}
                  />
                ) : paneMode === 'preview' ? (
                  <WebPreview html={files['index.html'] || ''} css={files['styles.css'] || ''} js={files['script.js'] || ''} />
                ) : (
                  <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[#0E0E1A] p-4 font-mono text-xs leading-6 text-white/60">
                    Console for web preview — <code className="rounded bg-white/10 px-1">console.log</code> output appears in the browser devtools and here when captured.
                    <div className="mt-4 rounded bg-white/5 p-3 text-white/40">Open the Preview and use the browser console for full logs.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pyodide */}
      {isPython && (
        <PyodideRunner
          ref={pyodideRef}
          onStatus={(s) => {
            if (s === 'loading') setPyStatus('Loading Python runtime…');
            if (s === 'running') setPyStatus('Running…');
            if (s === 'ready') setPyStatus('Ready');
          }}
          onReady={() => setPyStatus('Ready')}
          onResult={(res) => {
            setRunning(false);
            setStdout(res.stdout);
            setStderr(res.stderr);
            setPyStatus(res.ok ? 'Finished' : 'Error');
          }}
        />
      )}

      {/* Rename modal */}
      {renameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--ink-900)]/40 backdrop-blur-sm" onClick={() => setRenameOpen(false)} />
          <div className="relative w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--ink-900)]">Rename project</h3>
              <button onClick={() => setRenameOpen(false)} className="rounded-full p-1.5 text-[var(--ink-400)] hover:bg-[var(--surface-sunken)]">
                <X className="size-4" />
              </button>
            </div>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
              }}
              autoFocus
              maxLength={80}
              placeholder="Project name"
              className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--line)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--ink-900)] focus:ring-2 focus:ring-[var(--ink-900)]/10"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setRenameOpen(false)} className="rounded-full px-4 py-2 text-sm font-medium hover:bg-[var(--surface-sunken)]">
                Cancel
              </button>
              <button onClick={handleRename} className="rounded-full bg-[var(--ink-900)] px-5 py-2 text-sm font-semibold text-white hover:bg-black">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
