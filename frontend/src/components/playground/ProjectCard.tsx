'use client';

import { Code2, FileCode, MoreVertical, Clock, Globe, Terminal } from 'lucide-react';
import type { PlaygroundProject } from '@/lib/playground/types';

interface Props {
  project: PlaygroundProject;
  onOpen: () => void;
  onMenu: () => void;
}

export default function ProjectCard({ project, onOpen, onMenu }: Props) {
  const isWeb = project.kind === 'web';
  const updated = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-card)] shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]">
      <button onClick={onOpen} className="flex flex-1 flex-col text-left">
        <div className={`h-1.5 w-full ${isWeb ? 'bg-[var(--brand-violet)]' : 'bg-[var(--brand-gold)]'}`} />
        <div className="flex items-start gap-3 p-4">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
              isWeb ? 'bg-[var(--brand-violet-100)] text-[var(--brand-violet-600)]' : 'bg-[var(--brand-gold-100)] text-[var(--brand-gold-600)]'
            }`}
          >
            {isWeb ? <Globe className="size-5" /> : <Terminal className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-[var(--ink-900)]">{project.name}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--ink-500)]">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ring-1 ${
                  isWeb
                    ? 'bg-[var(--brand-violet-100)] text-[var(--brand-violet-600)] ring-[var(--brand-violet-100)]'
                    : 'bg-amber-50 text-amber-700 ring-amber-100'
                }`}
              >
                {isWeb ? 'Web' : 'Python'}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileCode className="size-3" />
                {Object.keys(project.files).length} files
              </span>
              {project.syncState === 'pending' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Pending sync
                </span>
              )}
              {project.syncState === 'synced' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  Synced
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mx-4 mb-3 line-clamp-2 min-h-[2.2rem] rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-sunken)]/40 p-2.5 font-mono text-xs leading-5 text-[var(--ink-500)]">
          {Object.values(project.files)[0]?.slice(0, 160) || 'Empty project — start coding.'}
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--surface-sunken)]/20 px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-500)]">
          <Clock className="size-3.5" />
          {updated}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpen}
            className="rounded-full bg-[var(--ink-900)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
          >
            Open
          </button>
          <button
            onClick={onMenu}
            className="rounded-full p-1.5 text-[var(--ink-500)] hover:bg-white hover:text-[var(--ink-900)]"
            aria-label="Project options"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
