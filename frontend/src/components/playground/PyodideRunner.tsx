'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface PyodideRunnerHandle {
  run: (code: string) => void;
}

interface Props {
  onStatus?: (status: string) => void;
  onResult?: (result: { stdout: string; stderr: string; ok: boolean }) => void;
  onReady?: () => void;
}

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js';
const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';

const PyodideRunner = forwardRef<PyodideRunnerHandle, Props>(function PyodideRunner({ onStatus, onResult, onReady }, ref) {
  const pyodideRef = useRef<any>(null);
  const loadingRef = useRef<Promise<any> | null>(null);
  const readyRef = useRef(false);

  const ensurePyodide = async () => {
    if (pyodideRef.current) return pyodideRef.current;
    if (loadingRef.current) return loadingRef.current;

    onStatus?.('loading');
    loadingRef.current = new Promise(async (resolve, reject) => {
      try {
        // Load script
        if (!document.querySelector(`script[src="${PYODIDE_URL}"]`)) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement('script');
            s.src = PYODIDE_URL;
            s.onload = () => res();
            s.onerror = () => rej(new Error('Failed to load Pyodide'));
            document.head.appendChild(s);
          });
        }
        // @ts-ignore
        const py = await (window as any).loadPyodide({ indexURL: PYODIDE_INDEX });
        pyodideRef.current = py;
        readyRef.current = true;
        onReady?.();
        onStatus?.('ready');
        resolve(py);
      } catch (e) {
        loadingRef.current = null;
        reject(e);
      }
    });
    return loadingRef.current;
  };

  useImperativeHandle(ref, () => ({
    run: async (code: string) => {
      let stdout = '';
      let stderr = '';
      onStatus?.('running');
      try {
        const py = await ensurePyodide();
        py.setStdout({ batched: (s: string) => (stdout += s + '\n') });
        py.setStderr({ batched: (s: string) => (stderr += s + '\n') });
        // Try to preload packages from imports for nicer UX
        try {
          await py.loadPackagesFromImports(code);
        } catch {
          // ignore preload failure, run anyway
        }
        await py.runPythonAsync(code || '');
        onResult?.({ stdout, stderr, ok: true });
        onStatus?.('finished');
      } catch (err: any) {
        const msg = String(err?.message ?? err);
        stderr += (stderr ? '\n' : '') + msg + '\n';
        onResult?.({ stdout, stderr, ok: false });
        onStatus?.('error');
      }
    },
  }));

  // Warmup on mount: start loading in background, but don't block
  useEffect(() => {
    void ensurePyodide().catch(() => {
      // silent
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
});

export default PyodideRunner;
