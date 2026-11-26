export interface PyodideRunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

export interface PyodideRunCallbacks {
  onStatus?: (phase: 'loading' | 'initializing' | 'ready', message: string) => void;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
}

class PyodideClient {
  private worker: Worker | null = null;
  private reqId = 0;
  private activeReject: ((err: Error) => void) | null = null;

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url), {
        type: 'module',
      });
    }
    return this.worker;
  }

  run(code: string, callbacks?: PyodideRunCallbacks): Promise<PyodideRunResult> {
    const worker = this.getWorker();
    const id = ++this.reqId;

    return new Promise<PyodideRunResult>((resolve, reject) => {
      this.activeReject = reject;

      const onMessage = (e: MessageEvent) => {
        const msg = e.data;
        if (msg.type === 'status') {
          callbacks?.onStatus?.(msg.phase, msg.message);
          return;
        }
        if (msg.id !== id) return;
        if (msg.type === 'stdout') {
          callbacks?.onStdout?.(msg.chunk);
        } else if (msg.type === 'stderr') {
          callbacks?.onStderr?.(msg.chunk);
        } else if (msg.type === 'done') {
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
          this.activeReject = null;
          resolve({ ok: !!msg.ok, stdout: msg.stdout || '', stderr: msg.stderr || '' });
        }
      };

      const onError = (err: ErrorEvent) => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        this.activeReject = null;
        reject(new Error(err.message || 'Python runtime worker error'));
      };

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.postMessage({ id, type: 'run', code });
    });
  }

  /**
   * Immediately interrupts a running Python script by terminating the worker.
   */
  stop(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.activeReject) {
      this.activeReject(new Error('Execution stopped by user'));
      this.activeReject = null;
    }
  }
}

export const pyodideClient = new PyodideClient();
