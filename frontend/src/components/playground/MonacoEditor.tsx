'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { OnMount } from '@monaco-editor/react';

const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), { ssr: false });

interface Props {
  file: string;
  language: string;
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
}

export default function MonacoEditor({ file, language, value, onChange, onRun }: Props) {
  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun?.();
      });
      // improve font
      // monaco.editor.defineTheme etc could be added
      editor.focus();
    },
    [onRun]
  );

  // Map our language ids to monaco ids
  const monacoLang =
    language === 'html' ? 'html' : language === 'css' ? 'css' : language === 'javascript' ? 'javascript' : language === 'python' ? 'python' : 'plaintext';

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1">
        <Editor
          path={file}
          language={monacoLang}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 20,
            fontFamily: 'Space Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
          }}
          loading={
            <div className="flex h-full items-center justify-center bg-white p-4 font-mono text-xs text-[var(--ink-400)]">
              Loading editor…
            </div>
          }
        />
      </div>
      <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--surface-sunken)]/40 px-3 py-1 text-[11px] text-[var(--ink-500)]">
        <span className="font-mono">
          {file} · {monacoLang}
        </span>
        <span className="hidden sm:inline">Ctrl + Enter to run</span>
      </div>
    </div>
  );
}

export function FallbackEditor({ value, onChange, language }: { value: string; onChange: (v: string) => void; language: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      data-language={language}
      className="h-full w-full resize-none border-0 bg-white p-4 font-mono text-[13px] leading-6 text-[var(--ink-900)] outline-none"
      placeholder="Start coding…"
    />
  );
}
