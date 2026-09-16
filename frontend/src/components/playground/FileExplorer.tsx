'use client';

import { fileLabel } from '@/lib/playground/templates';
import { FileCode2, Palette, Braces, FileText, FolderOpen, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { PlaygroundKind } from '@/lib/playground/types';

interface Props {
  kind: PlaygroundKind;
  files: string[];
  active: string;
  onSelect: (file: string) => void;
  onResetFile?: (file: string) => void;
  collapsed?: boolean;
}

const iconMap: Record<string, typeof FileCode2> = {
  'index.html': FileCode2,
  'styles.css': Palette,
  'script.js': Braces,
  'main.py': FileText,
};

export default function FileExplorer({ kind, files, active, onSelect, onResetFile }: Props) {
  return (
    <div className="flex h-full flex-col border-r border-[var(--line)] bg-[var(--surface-sunken)]/40">
      <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface-sunken)]/60 px-3 py-2.5">
        <FolderOpen className="size-4 text-[var(--ink-500)]" />
        <span className="text-[11px] font-semibold tracking-widest text-[var(--ink-500)] uppercase">Explorer</span>
        <span className="ml-auto rounded bg-[var(--surface-card)] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[var(--ink-700)] uppercase ring-1 ring-[var(--line)]">
          {kind}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="mb-2 px-2 py-1 text-[10px] font-semibold tracking-widest text-[var(--ink-300)] uppercase">
          {kind === 'python' ? 'Python Project' : 'Web Project'}
        </div>
        <div className="space-y-0.5">
          {files.map((file) => {
            const selected = file === active;
            const Icon = iconMap[file] || FileText;
            return (
              <button
                key={file}
                onClick={() => onSelect(file)}
                className={`group flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm transition-colors ${
                  selected
                    ? 'bg-[var(--ink-900)] text-white'
                    : 'text-[var(--ink-700)] hover:bg-[var(--surface-card)] hover:text-[var(--ink-900)]'
                }`}
              >
                <Icon className={`size-4 shrink-0 ${selected ? 'text-white/80' : 'text-[var(--ink-400)]'}`} />
                <span className="flex-1 truncate text-[13px] font-medium">{file}</span>
                <span className={`shrink-0 text-[11px] ${selected ? 'text-white/50' : 'text-[var(--ink-300)]'}`}>{fileLabel(file)}</span>
                {onResetFile && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onResetFile(file);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        onResetFile(file);
                      }
                    }}
                    className={`hidden rounded p-1 group-hover:block ${selected ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-[var(--ink-400)] hover:bg-[var(--surface-sunken)]'}`}
                    title="Reset file"
                  >
                    <RotateCcw className="size-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {kind === 'web' && (
          <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] p-3">
            <p className="text-xs leading-5 text-[var(--ink-500)]">
              Add more files, images and libraries in a future update. Your HTML, CSS and JS are sandboxed and live-previewed.
            </p>
          </div>
        )}

        {kind === 'python' && (
          <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-card)] p-3">
            <p className="mb-2 text-xs font-semibold text-[var(--ink-900)]">Tips</p>
            <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-[var(--ink-500)]">
              <li>
                <code className="rounded bg-[var(--surface-sunken)] px-1 py-0.5">input()</code> is not supported in this preview.
              </li>
              <li>Packages are auto-loaded from imports (numpy, etc.) when available.</li>
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--line)] bg-[var(--surface-card)] p-2 text-[11px] text-[var(--ink-300)]">
        {files.length} file{files.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
