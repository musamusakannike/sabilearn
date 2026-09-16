'use client';

import { fileLabel } from '@/lib/playground/templates';
import { FileCode2, Palette, Braces, FileText } from 'lucide-react';

interface Props {
  files: string[];
  active: string;
  onChange: (file: string) => void;
  onClose?: (file: string) => void;
  dirtyFile?: string | null;
}

const iconMap: Record<string, typeof FileCode2> = {
  'index.html': FileCode2,
  'styles.css': Palette,
  'script.js': Braces,
  'main.py': FileText,
};

export default function FileTabs({ files, active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--line)] bg-[var(--surface-card)] px-2 py-1.5 scrollbar-thin">
      {files.map((file) => {
        const selected = file === active;
        const Icon = iconMap[file] || FileText;
        return (
          <button
            key={file}
            onClick={() => onChange(file)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors ${
              selected
                ? 'bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]'
                : 'bg-transparent text-[var(--ink-500)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)]'
            }`}
            role="tab"
            aria-selected={selected}
          >
            <Icon className="size-3.5 shrink-0 opacity-80" />
            {fileLabel(file)}
            <span className={`ml-1 text-[10px] font-normal ${selected ? 'text-white/60' : 'text-[var(--ink-300)]'}`}>{file}</span>
          </button>
        );
      })}
    </div>
  );
}
