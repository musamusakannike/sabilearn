'use client';

import { create } from 'zustand';
import type { PlaygroundProject, PlaygroundKind } from '@/lib/playground/types';
import { defaultFiles } from '@/lib/playground/templates';
import { loadProjects, saveProjects, loadDirtyIds, saveDirtyIds } from '@/lib/playground/storage';
import { mergeProjects, pullRemoteProjects, pushProject } from '@/lib/playground/sync';

interface PlaygroundState {
  projects: PlaygroundProject[];
  dirtyIds: string[];
  hydrated: boolean;
  syncing: boolean;
  lastConflict: boolean;
  hydrate: () => Promise<void>;
  syncNow: () => Promise<void>;
  createProject: (kind: PlaygroundKind, name: string) => Promise<PlaygroundProject>;
  updateProject: (localId: string, patch: Partial<Pick<PlaygroundProject, 'name' | 'files'>>) => Promise<void>;
  duplicateProject: (localId: string) => Promise<PlaygroundProject | null>;
  deleteProject: (localId: string) => Promise<void>;
  getProject: (localId: string) => PlaygroundProject | undefined;
}

function persist(projects: PlaygroundProject[], dirtyIds: string[]) {
  saveProjects(projects);
  saveDirtyIds(dirtyIds);
}

function markDirty(dirtyIds: string[], localId: string) {
  return dirtyIds.includes(localId) ? dirtyIds : [...dirtyIds, localId];
}

function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('sabilearn_token');
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  projects: [],
  dirtyIds: [],
  hydrated: false,
  syncing: false,
  lastConflict: false,

  hydrate: async () => {
    const projects = loadProjects();
    const dirtyIds = loadDirtyIds();
    set({
      projects: projects.filter((p) => !p.deletedAt),
      dirtyIds,
      hydrated: true,
    });
    await get().syncNow();
  },

  syncNow: async () => {
    if (get().syncing) return;
    if (!isAuthenticated()) return;
    set({ syncing: true, lastConflict: false });
    try {
      const stored = loadProjects();
      const dirty = loadDirtyIds();
      let merged = stored;
      let conflict = false;

      const remote = await pullRemoteProjects();
      if (remote) {
        merged = mergeProjects(stored, remote);
      }

      const stillDirty: string[] = [];
      for (const id of dirty) {
        const proj = merged.find((p) => p.localId === id);
        if (!proj) continue;
        const result = await pushProject(proj);
        if (!result) {
          stillDirty.push(id);
          continue;
        }
        if (result.conflict) conflict = true;
        merged = merged.map((p) => (p.localId === id ? { ...result.project, syncState: 'synced' } : p));
      }

      const withState = merged.map((p) => ({
        ...p,
        syncState: (stillDirty.includes(p.localId) ? 'pending' : p.id ? 'synced' : 'local') as PlaygroundProject['syncState'],
      }));

      persist(withState, stillDirty);
      set({
        projects: withState.filter((p) => !p.deletedAt),
        dirtyIds: stillDirty,
        lastConflict: conflict,
      });
    } finally {
      set({ syncing: false });
    }
  },

  createProject: async (kind, name) => {
    const now = new Date().toISOString();
    const project: PlaygroundProject = {
      localId: crypto.randomUUID(),
      name: name.trim() || (kind === 'python' ? 'Untitled Python' : 'Untitled Web'),
      kind,
      files: defaultFiles(kind),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncState: 'pending',
    };
    const all = loadProjects();
    const next = [project, ...all];
    const dirty = markDirty(get().dirtyIds, project.localId);
    persist(next, dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
    void get().syncNow();
    return project;
  },

  updateProject: async (localId, patch) => {
    const all = loadProjects();
    const now = new Date().toISOString();
    const next = all.map((p) =>
      p.localId === localId
        ? {
            ...p,
            ...patch,
            files: patch.files ?? p.files,
            updatedAt: now,
            syncState: 'pending' as const,
          }
        : p
    );
    const dirty = markDirty(get().dirtyIds, localId);
    persist(next, dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
  },

  duplicateProject: async (localId) => {
    const source = loadProjects().find((p) => p.localId === localId && !p.deletedAt);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy: PlaygroundProject = {
      ...source,
      id: undefined,
      localId: crypto.randomUUID(),
      name: `Copy of ${source.name}`.slice(0, 80),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncState: 'pending',
    };
    const all = loadProjects();
    const next = [copy, ...all];
    const dirty = markDirty(get().dirtyIds, copy.localId);
    persist(next, dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
    void get().syncNow();
    return copy;
  },

  deleteProject: async (localId) => {
    const all = loadProjects();
    const now = new Date().toISOString();
    const next = all.map((p) =>
      p.localId === localId ? { ...p, deletedAt: now, updatedAt: now, syncState: 'pending' as const } : p
    );
    const dirty = markDirty(get().dirtyIds, localId);
    persist(next, dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
    void get().syncNow();
  },

  getProject: (localId) => get().projects.find((p) => p.localId === localId),
}));
