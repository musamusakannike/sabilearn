import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconDownload,
  IconMaximize,
  IconMinimize,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconUpload,
} from '@tabler/icons-react';
import { Badge, Button, EmptyState, Kbd, Skeleton, SplitPane } from '@/components/ui';
import { usePlaygroundStore } from '@/stores/playground.store';
import { useUiStore } from '@/stores/ui.store';
import {
  buildSandboxedWebPreviewHtml,
  fileLanguage,
} from '@/lib/playgroundTemplates';
import { pyodideClient } from '@/lib/pyodideClient';
import { isMac, pickFiles, saveTextFile } from '@/platform';

const CodeEditor = React.lazy(() => import('./CodeEditor'));

export function PlaygroundIdePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hydrated, hydrate, getProject, updateProject, syncNow, lastConflict } =
    usePlaygroundStore();
  const toast = useUiStore((s) => s.toast);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const project = id ? getProject(id) : undefined;
  const fileNames = useMemo(() => Object.keys(project?.files || {}), [project?.files]);

  const [activeFile, setActiveFile] = useState<string>('');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [fullscreenOutput, setFullscreenOutput] = useState(false);

  // Web preview state
  const [previewHtml, setPreviewHtml] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ level: string; text: string }>>([]);

  // Python runtime state
  const [runningPy, setRunningPy] = useState(false);
  const [pyStatus, setPyStatus] = useState('');
  const [pyStdout, setPyStdout] = useState('');
  const [pyStderr, setPyStderr] = useState('');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestFilesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!project) return;
    setFiles(project.files);
    latestFilesRef.current = project.files;
    const keys = Object.keys(project.files);
    setActiveFile((prev) => (prev && keys.includes(prev) ? prev : keys[0] || ''));
    if (project.kind === 'web') {
      setPreviewHtml(buildSandboxedWebPreviewHtml(project.files));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.localId]);

  // Listen for console messages from sandboxed preview iframe
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'sabilearn-preview-console') {
        setConsoleLogs((prev) => [...prev.slice(-80), { level: e.data.level, text: e.data.text }]);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Debounced preview refresh for Web projects
  useEffect(() => {
    if (project?.kind !== 'web') return;
    const t = setTimeout(() => {
      setConsoleLogs([]);
      setPreviewHtml(buildSandboxedWebPreviewHtml(files));
    }, 350);
    return () => clearTimeout(t);
  }, [files, project?.kind]);

  // Flush unsaved edits on unmount
  useEffect(() => {
    const localId = project?.localId;
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (localId && Object.keys(latestFilesRef.current).length > 0) {
        void updateProject(localId, { files: latestFilesRef.current }).then(() => void syncNow());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.localId]);

  const handleCodeChange = (nextVal: string) => {
    if (!project || !activeFile) return;
    const nextFiles = { ...files, [activeFile]: nextVal };
    setFiles(nextFiles);
    latestFilesRef.current = nextFiles;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void updateProject(project.localId, { files: nextFiles });
    }, 700);
  };

  const handleRun = useCallback(async () => {
    if (!project) return;
    if (project.kind === 'web') {
      setConsoleLogs([]);
      setPreviewHtml(buildSandboxedWebPreviewHtml(latestFilesRef.current));
      return;
    }
    if (runningPy) return;
    setRunningPy(true);
    setPyStdout('');
    setPyStderr('');
    try {
      const code = latestFilesRef.current[activeFile] || latestFilesRef.current['main.py'] || '';
      await pyodideClient.run(code, {
        onStatus: (_p, msg) => setPyStatus(msg),
        onStdout: (chunk) => setPyStdout((s) => s + chunk),
        onStderr: (chunk) => setPyStderr((s) => s + chunk),
      });
    } catch (err) {
      setPyStderr((s) => s + (err instanceof Error ? err.message : String(err)) + '\n');
    } finally {
      setRunningPy(false);
      setPyStatus('');
    }
  }, [project, activeFile, runningPy]);

  const handleStopPy = () => {
    pyodideClient.stop();
    setRunningPy(false);
    setPyStatus('Execution stopped');
  };

  const handleImportFile = async () => {
    if (!project) return;
    const picked = await pickFiles({
      title: 'Import code file',
      extensions: project.kind === 'python' ? ['py', 'txt'] : ['html', 'css', 'js', 'txt'],
    });
    if (picked.length === 0) return;
    const text = await picked[0].file.text();
    const targetName = fileNames.includes(picked[0].name) ? picked[0].name : activeFile || picked[0].name;
    const nextFiles = { ...files, [targetName]: text };
    setFiles(nextFiles);
    latestFilesRef.current = nextFiles;
    setActiveFile(targetName);
    await updateProject(project.localId, { files: nextFiles });
    toast({ title: `Imported ${picked[0].name}`, variant: 'success' });
  };

  const handleExportFile = async () => {
    if (!activeFile) return;
    const ok = await saveTextFile(activeFile, files[activeFile] || '');
    if (ok) toast({ title: `Exported ${activeFile}`, variant: 'success' });
  };

  if (!hydrated) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-xl mx-auto p-10">
        <EmptyState
          mascot
          title="Project not found"
          action={<Button onClick={() => navigate('/playground')}>Back to Playground</Button>}
        />
      </div>
    );
  }

  const mod = isMac() ? '⌘' : 'Ctrl';

  const editorPane = (
    <div className="h-full flex flex-col bg-[var(--surface-card)]">
      <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]/50 overflow-x-auto shrink-0">
        {Object.keys(files).map((fname) => (
          <button
            key={fname}
            type="button"
            onClick={() => setActiveFile(fname)}
            className={[
              'px-3 py-1 rounded-[var(--radius-sm)] text-[12.5px] font-mono font-medium cursor-pointer transition-colors',
              fname === activeFile
                ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] font-semibold'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {fname}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 p-2">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <CodeEditor
            value={files[activeFile] || ''}
            language={fileLanguage(activeFile)}
            onChange={handleCodeChange}
            onRun={() => void handleRun()}
          />
        </Suspense>
      </div>
    </div>
  );

  const outputPane =
    project.kind === 'web' ? (
      <div className="h-full flex flex-col bg-[var(--surface-card)]">
        <div className="px-3.5 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between text-[12px] font-semibold text-[var(--text-secondary)] shrink-0">
          <span>Sandboxed Preview</span>
          <button
            type="button"
            onClick={() => void handleRun()}
            className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer"
          >
            <IconRefresh size={14} /> Reload
          </button>
        </div>
        <iframe
          title="Web preview"
          sandbox="allow-scripts"
          srcDoc={previewHtml}
          className="flex-1 w-full border-0 bg-white"
        />
        {consoleLogs.length > 0 && (
          <div className="h-32 border-t border-[var(--border-default)] bg-[#0E0E1A] text-[#F4F2EC] p-2.5 font-mono text-[12px] overflow-y-auto shrink-0">
            <div className="text-[10.5px] uppercase tracking-wider text-[#A9A9BC] mb-1">Console</div>
            {consoleLogs.map((l, idx) => (
              <div
                key={idx}
                className={
                  l.level === 'error'
                    ? 'text-[#F87171]'
                    : l.level === 'warn'
                      ? 'text-[#FBBF24]'
                      : 'text-[#F4F2EC]'
                }
              >
                {l.text}
              </div>
            ))}
          </div>
        )}
      </div>
    ) : (
      <div className="h-full flex flex-col bg-[#0E0E1A] text-[#F4F2EC]">
        <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between text-[12px] shrink-0">
          <span className="font-mono font-semibold text-[#CBC8D8]">Python Console (Pyodide)</span>
          {pyStatus && <span className="text-[#F8BE43]">{pyStatus}</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
          {!pyStdout && !pyStderr && !runningPy && (
            <div className="text-[#848199]">
              Press Run ({mod}+Enter) to execute Python. First run downloads Pyodide and caches it
              locally.
            </div>
          )}
          {pyStdout && <pre className="m-0 whitespace-pre-wrap">{pyStdout}</pre>}
          {pyStderr && <pre className="m-0 whitespace-pre-wrap text-[#F87171]">{pyStderr}</pre>}
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            icon={<IconArrowLeft size={15} />}
            onClick={() => navigate('/playground')}
          >
            Projects
          </Button>
          <span className="font-bold text-[14.5px] truncate">{project.name}</span>
          <Badge variant={project.syncState === 'synced' ? 'success' : 'warning'}>
            {project.syncState || 'local'}
          </Badge>
          {lastConflict && (
            <Badge variant="warning">
              <IconAlertTriangle size={12} /> Conflict merged (latest wins)
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<IconUpload size={14} />} onClick={handleImportFile}>
            Import
          </Button>
          <Button variant="secondary" size="sm" icon={<IconDownload size={14} />} onClick={handleExportFile}>
            Export
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={fullscreenOutput ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
            onClick={() => setFullscreenOutput((v) => !v)}
          >
            {fullscreenOutput ? 'Split' : 'Expand Output'}
          </Button>
          {runningPy ? (
            <Button variant="danger" size="sm" icon={<IconPlayerStop size={15} />} onClick={handleStopPy}>
              Stop
            </Button>
          ) : (
            <Button size="sm" icon={<IconPlayerPlay size={15} />} onClick={() => void handleRun()}>
              Run <Kbd className="ml-1 !bg-black/15 !border-black/20">{mod}↵</Kbd>
            </Button>
          )}
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="flex-1 min-h-0">
        {fullscreenOutput ? outputPane : <SplitPane left={editorPane} right={outputPane} initialLeftPercent={54} />}
      </div>
    </div>
  );
}
