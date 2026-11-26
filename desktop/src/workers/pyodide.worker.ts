/// <reference lib="webworker" />

const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/';
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`;

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (msg: string) => void }) => void;
  setStderr: (opts: { batched: (msg: string) => void }) => void;
}

let pyodide: PyodideInstance | null = null;
let loadPromise: Promise<PyodideInstance> | null = null;

async function ensurePyodide(): Promise<PyodideInstance> {
  if (pyodide) return pyodide;
  if (!loadPromise) {
    loadPromise = (async () => {
      self.postMessage({ type: 'status', phase: 'loading', message: 'Downloading Python runtime (Pyodide)...' });
      const mod = await import(/* @vite-ignore */ PYODIDE_SCRIPT_URL);
      self.postMessage({ type: 'status', phase: 'initializing', message: 'Initializing Python runtime...' });
      const instance = (await mod.loadPyodide({
        indexURL: PYODIDE_INDEX_URL,
      })) as PyodideInstance;
      pyodide = instance;
      self.postMessage({ type: 'status', phase: 'ready', message: 'Python ready' });
      return instance;
    })();
  }
  return loadPromise;
}

self.onmessage = async (event: MessageEvent<{ id: number; type: 'run' | 'warmup'; code?: string }>) => {
  const { id, type, code } = event.data;
  try {
    const py = await ensurePyodide();
    if (type === 'warmup') {
      self.postMessage({ type: 'done', id, ok: true, stdout: '', stderr: '' });
      return;
    }

    let stdout = '';
    let stderr = '';

    py.setStdout({
      batched: (msg: string) => {
        stdout += msg + '\n';
        self.postMessage({ type: 'stdout', id, chunk: msg + '\n' });
      },
    });
    py.setStderr({
      batched: (msg: string) => {
        stderr += msg + '\n';
        self.postMessage({ type: 'stderr', id, chunk: msg + '\n' });
      },
    });

    await py.runPythonAsync(code || '');
    self.postMessage({ type: 'done', id, ok: true, stdout, stderr });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'stderr', id, chunk: msg + '\n' });
    self.postMessage({ type: 'done', id, ok: false, stdout: '', stderr: msg });
  }
};
