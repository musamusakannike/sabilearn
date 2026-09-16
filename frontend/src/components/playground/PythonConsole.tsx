'use client';

import { useEffect, useRef } from 'react';
import { Terminal, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  stdout: string;
  stderr: string;
  status: string;
  running: boolean;
  onClear?: () => void;
}

export default function PythonConsole({ stdout, stderr, status, running, onClear }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [stdout, stderr]);

  const empty = !stdout && !stderr;
  const fullOutput = `${stdout}${stderr ? '\n' + stderr : ''}`;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[#0E0E1A]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#1A1A2E] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
          <Terminal className="size-3.5" />
          Console
          {running && <span className="ml-2 inline-flex items-center gap-1.5 text-[var(--brand-gold)]"><span className="size-2 animate-pulse rounded-full bg-[var(--brand-gold)]" /> Running</span>}
          {!running && status && <span className="ml-2 text-white/40">· {status}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (!fullOutput) return;
              navigator.clipboard.writeText(fullOutput);
              toast.success('Copied output');
            }}
            className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            title="Copy output"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            onClick={onClear}
            className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            title="Clear"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div ref={ref} className="flex-1 overflow-auto p-4 font-mono text-[13px] leading-6">
        {empty ? (
          <div className="text-sm text-white/30">Output will appear here once you run your code. Press <span className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-white/60">Run</span> or <span className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-white/60">Ctrl + Enter</span>.</div>
        ) : (
          <>
            {!!stdout && <pre className="whitespace-pre-wrap break-words text-[#EDEDF5]">{stdout}</pre>}
            {!!stderr && <pre className="mt-2 whitespace-pre-wrap break-words text-[#FF8A8F]">{stderr}</pre>}
          </>
        )}
      </div>
    </div>
  );
}
