'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, Plus, Search, Sparkles, LayoutGrid, Terminal, Globe, RefreshCw, Trash2, Copy, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { usePlaygroundStore } from '@/store/playground.store';
import ProjectCard from '@/components/playground/ProjectCard';
import CreateProjectDialog from '@/components/playground/CreateProjectDialog';
import type { PlaygroundKind } from '@/lib/playground/types';

export default function PlaygroundPage() {
  const router = useRouter();
  const { projects, hydrate, syncNow, syncing, createProject, duplicateProject, deleteProject, updateProject, hydrated, lastConflict } =
    usePlaygroundStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | PlaygroundKind>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (lastConflict) toast.info('Loaded a newer copy from your account.');
  }, [lastConflict]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== 'all' && p.kind !== filter) return false;
      if (!q) return true;
      const name = p.name || (p.kind === 'python' ? 'Untitled python' : 'Untitled web');
      return name.toLowerCase().includes(q) || p.kind.includes(q);
    });
  }, [projects, query, filter]);

  const handleCreate = async (kind: PlaygroundKind, name: string) => {
    setCreateOpen(false);
    const project = await createProject(kind, name);
    toast.success(`Created “${project.name}”`);
    router.push(`/dashboard/playground/${project.localId}`);
  };

  const openMenu = (localId: string) => setMenuTarget((prev) => (prev === localId ? null : localId));

  return (
    <div className="-mx-6 -my-8 lg:-mx-10 lg:-my-10">
      {/* Header */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-card)]">
        <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10 lg:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--ink-900)] text-white shadow-[var(--shadow-sm)]">
                <Code2 className="size-6" />
              </div>
              <div>
                <h1 className="text-xl font-[var(--font-display)] font-bold tracking-tight text-[var(--ink-900)] lg:text-2xl">
                  Code Playground
                </h1>
                <p className="mt-0.5 max-w-xl text-sm leading-5 text-[var(--text-muted)]">
                  A lightweight IDE for HTML, CSS, JavaScript and Python. Projects save locally and sync to your account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void syncNow()}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-card)] px-4 py-2.5 text-sm font-medium text-[var(--ink-700)] hover:bg-[var(--surface-sunken)] disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing…' : 'Sync'}
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-semibold text-[var(--ink-900)] shadow-[var(--shadow-xs)] hover:bg-[var(--brand-gold-600)]"
              >
                <Plus className="size-4" />
                New project
              </button>
            </div>
          </div>

          {/* Search + filters */}
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-300)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects…"
                className="w-full rounded-full border border-[var(--line)] bg-[var(--surface-sunken)]/40 py-2.5 pl-10 pr-4 text-sm text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-300)] focus:border-[var(--ink-900)] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full bg-[var(--surface-sunken)] p-1">
                {(
                  [
                    { v: 'all' as const, label: 'All', icon: LayoutGrid },
                    { v: 'web' as const, label: 'Web', icon: Globe },
                    { v: 'python' as const, label: 'Python', icon: Terminal },
                  ] as const
                ).map(({ v, label, icon: Icon }) => (
                  <button
                    key={v}
                    onClick={() => setFilter(v)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      filter === v ? 'bg-white text-[var(--ink-900)] shadow-[var(--shadow-xs)]' : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <span className="hidden text-xs text-[var(--ink-400)] sm:inline">
                {!hydrated ? 'Loading…' : `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10 lg:py-8">
        {!hydrated ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-card)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--line-strong)] bg-[var(--surface-card)] px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--brand-gold-100)]">
              <Sparkles className="size-7 text-[var(--brand-gold-600)]" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-[var(--ink-900)]">
              {query || filter !== 'all' ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-5 text-[var(--ink-500)]">
              {query || filter !== 'all'
                ? 'Try a different search or switch the filter.'
                : 'Create a web page or a Python file — it saves on this device and syncs to your account when you sign in.'}
            </p>
            {!query && filter === 'all' && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ink-900)] px-6 py-3 text-sm font-semibold text-white hover:bg-black"
              >
                <Plus className="size-4" />
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <div key={project.localId} className="relative">
                <ProjectCard
                  project={project}
                  onOpen={() => router.push(`/dashboard/playground/${project.localId}`)}
                  onMenu={() => openMenu(project.localId)}
                />
                {menuTarget === project.localId && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuTarget(null)} />
                    <div className="absolute right-2 top-2 z-20 w-52 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-card)] p-1 shadow-[var(--shadow-md)]">
                      <button
                        onClick={() => {
                          const name = window.prompt('Rename project', project.name);
                          if (name && name.trim()) {
                            void updateProject(project.localId, { name: name.trim() });
                            void syncNow();
                            toast.success('Renamed');
                          }
                          setMenuTarget(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--ink-700)] hover:bg-[var(--surface-sunken)]"
                      >
                        <Pencil className="size-4" /> Rename
                      </button>
                      <button
                        onClick={async () => {
                          const copy = await duplicateProject(project.localId);
                          setMenuTarget(null);
                          if (copy) {
                            toast.success('Duplicated');
                            router.push(`/dashboard/playground/${copy.localId}`);
                          }
                        }}
                        className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--ink-700)] hover:bg-[var(--surface-sunken)]"
                      >
                        <Copy className="size-4" /> Duplicate
                      </button>
                      <div className="my-1 h-px bg-[var(--line)]" />
                      <button
                        onClick={() => {
                          const ok = window.confirm(`Delete “${project.name}”? This cannot be undone on this device.`);
                          if (ok) {
                            void deleteProject(project.localId);
                            toast.success('Deleted');
                          }
                          setMenuTarget(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger-100)]"
                      >
                        <Trash2 className="size-4" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[var(--ink-300)]">
          Projects are stored locally and sync when you are signed in. Pull to sync with the mobile app.
        </p>
      </div>

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
