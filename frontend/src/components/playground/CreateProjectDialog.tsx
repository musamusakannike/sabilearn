'use client';

import { useState } from 'react';
import { X, Globe, Terminal, Sparkles } from 'lucide-react';
import type { PlaygroundKind } from '@/lib/playground/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (kind: PlaygroundKind, name: string) => void;
}

export default function CreateProjectDialog({ open, onClose, onCreate }: Props) {
  const [kind, setKind] = useState<PlaygroundKind>('web');
  const [name, setName] = useState('');

  if (!open) return null;

  const submit = () => {
    const trimmed = name.trim();
    onCreate(kind, trimmed || (kind === 'python' ? 'Untitled Python' : 'Untitled Web'));
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--ink-900)]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] shadow-[var(--shadow-md)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-gold-100)]">
              <Sparkles className="size-5 text-[var(--brand-gold-600)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--ink-900)]">New playground project</h2>
              <p className="text-xs text-[var(--ink-500)]">Pick a kind, give it a name and start coding.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[var(--ink-500)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)]">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { k: 'web' as const, label: 'Web', desc: 'HTML · CSS · JS', icon: Globe },
                { k: 'python' as const, label: 'Python', desc: 'Pyodide · console', icon: Terminal },
              ] as const
            ).map(({ k, label, desc, icon: Icon }) => {
              const selected = kind === k;
              return (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`flex flex-col items-start gap-2 rounded-[var(--radius-lg)] border-2 p-4 text-left transition-all ${
                    selected
                      ? 'border-[var(--brand-gold)] bg-[var(--brand-gold-100)]/40'
                      : 'border-[var(--line)] bg-[var(--surface-sunken)]/20 hover:border-[var(--line-strong)]'
                  }`}
                >
                  <span
                    className={`flex size-9 items-center justify-center rounded-[var(--radius-md)] ${
                      selected ? 'bg-[var(--brand-gold)] text-[var(--ink-900)]' : 'bg-[var(--surface-card)] text-[var(--ink-500)]'
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink-900)]">{label}</span>
                  <span className="text-xs text-[var(--ink-500)]">{desc}</span>
                </button>
              );
            })}
          </div>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-xs font-semibold tracking-wide text-[var(--ink-700)] uppercase">Project name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              placeholder={kind === 'python' ? 'e.g. Data playground' : 'e.g. Landing page'}
              maxLength={80}
              autoFocus
              className="w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-card)] px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-300)] focus:border-[var(--ink-900)] focus:ring-2 focus:ring-[var(--ink-900)]/10"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--surface-sunken)]/20 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-700)] hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-full bg-[var(--ink-900)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            Create & open
          </button>
        </div>
      </div>
    </div>
  );
}
