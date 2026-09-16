import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { PlaygroundKind, PlaygroundProject } from '@/lib/types';
import { defaultFiles } from '@/lib/playgroundTemplates';
import { loadDirtyIds, loadProjects, saveDirtyIds, saveProjects } from '@/lib/playgroundStorage';
import { mergeProjects, pullRemoteProjects, pushProject } from '@/lib/playgroundSync';
import { useAuthStore } from './auth.store';

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

async function persist(projects: PlaygroundProject[], dirtyIds: string[]) {
  await saveProjects(projects);
  await saveDirtyIds(dirtyIds);
}

function markDirty(dirtyIds: string[], localId: string) {
  return dirtyIds.includes(localId) ? dirtyIds : [...dirtyIds, localId];
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  projects: [],
  dirtyIds: [],
  hydrated: false,
  syncing: false,
  lastConflict: false,

  hydrate: async () => {
    const [projects, dirtyIds] = await Promise.all([loadProjects(), loadDirtyIds()]);
    set({
      projects: projects.filter((p) => !p.deletedAt),
      dirtyIds,
      hydrated: true,
    });
    await get().syncNow();
  },

  syncNow: async () => {
    if (get().syncing) return;
    const authenticated = useAuthStore.getState().isAuthenticated;
    if (!authenticated) return;

    set({ syncing: true, lastConflict: false });
    try {
      const stored = await loadProjects();
      const dirty = await loadDirtyIds();
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

      const nextDirty = stillDirty;
      const withState = merged.map((p) => ({
        ...p,
        syncState: (nextDirty.includes(p.localId)
          ? 'pending'
          : p.id
            ? 'synced'
            : 'local') as PlaygroundProject['syncState'],
      }));

      await persist(withState, nextDirty);
      set({
        projects: withState.filter((p) => !p.deletedAt),
        dirtyIds: nextDirty,
        lastConflict: conflict,
      });
    } finally {
      set({ syncing: false });
    }
  },

  createProject: async (kind, name) => {
    const now = new Date().toISOString();
    const project: PlaygroundProject = {
      localId: Crypto.randomUUID(),
      name: name.trim() || (kind === 'python' ? 'Untitled python' : 'Untitled web'),
      kind,
      files: defaultFiles(kind),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncState: 'pending',
    };
    const all = await loadProjects();
    const next = [project, ...all];
    const dirty = markDirty(get().dirtyIds, project.localId);
    await persist(next, dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
    void get().syncNow();
    return project;
  },

  updateProject: async (localId, patch) => {
    const all = await loadProjects();
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
    await persist(next, dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
  },

  duplicateProject: async (localId) => {
    const source = (await loadProjects()).find((p) => p.localId === localId && !p.deletedAt);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy: PlaygroundProject = {
      ...source,
      id: undefined,
      localId: Crypto.randomUUID(),
      name: `Copy of ${source.name}`.slice(0, 80),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncState: 'pending',
    };
    const all = await loadProjects();
    const next = [copy, ...all];
    const dirty = markDirty(get().dirtyIds, copy.localId);
    await persist(next, dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
    void get().syncNow();
    return copy;
  },

  deleteProject: async (localId) => {
    const all = await loadProjects();
    const now = new Date().toISOString();
    const next = all.map((p) =>
      p.localId === localId ? { ...p, deletedAt: now, updatedAt: now, syncState: 'pending' as const } : p
    );
    const dirty = markDirty(get().dirtyIds, localId);
    await persist(next, dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
    void get().syncNow();
  },

  getProject: (localId) => get().projects.find((p) => p.localId === localId),
}));
