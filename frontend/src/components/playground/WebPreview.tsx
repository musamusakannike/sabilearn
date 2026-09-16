'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface Props {
  html: string;
  css: string;
  js: string;
}

export default function WebPreview({ html, css, js }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;

  // Capture console from iframe
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'preview-console') {
        setLogs((prev) => [...prev.slice(-100), `[log] ${e.data.message}`]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-sunken)]/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#FF5F56]" />
            <span className="size-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="size-2.5 rounded-full bg-[#27C93F]" />
          </div>
          <span className="ml-2 text-[11px] font-medium tracking-wide text-[var(--ink-500)] uppercase">Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="rounded p-1.5 text-[var(--ink-500)] hover:bg-white hover:text-[var(--ink-900)]"
            title="Reload preview"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            onClick={() => {
              if (!iframeRef.current) return;
              const w = window.open();
              if (w) {
                w.document.write(srcDoc);
                w.document.close();
              }
            }}
            className="rounded p-1.5 text-[var(--ink-500)] hover:bg-white hover:text-[var(--ink-900)]"
            title="Open in new tab"
          >
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-white">
        <iframe
          key={key}
          ref={iframeRef}
          title="Web preview"
          sandbox="allow-scripts allow-modals"
          srcDoc={srcDoc}
          className="absolute inset-0 size-full border-0 bg-white"
        />
      </div>

      {logs.length > 0 && (
        <div className="max-h-28 overflow-auto border-t border-[var(--line)] bg-[#F8F8F6] px-3 py-2 font-mono text-xs leading-5 text-[var(--ink-700)]">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
