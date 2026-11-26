import { create } from 'zustand';
import { kvStore } from '@/platform';
import { PlaygroundKind, PlaygroundProject } from '@/lib/types';
import { defaultFiles } from '@/lib/playgroundTemplates';
import { mergeProjects, pullRemoteProjects, pushProject } from '@/lib/playgroundSync';
import { useAuthStore } from './auth.store';

const PROJECTS_KEY = 'playground_projects_v1';
const DIRTY_KEY = 'playground_dirty_v1';

async function loadProjects(): Promise<PlaygroundProject[]> {
  return (await kvStore.get<PlaygroundProject[]>(PROJECTS_KEY)) || [];
}
async function saveProjects(projects: PlaygroundProject[]): Promise<void> {
  await kvStore.set(PROJECTS_KEY, projects);
}
async function loadDirtyIds(): Promise<string[]> {
  return (await kvStore.get<string[]>(DIRTY_KEY)) || [];
}
async function saveDirtyIds(ids: string[]): Promise<void> {
  await kvStore.set(DIRTY_KEY, ids);
}

interface PlaygroundState {
  projects: PlaygroundProject[];
  dirtyIds: string[];
  hydrated: boolean;
  syncing: boolean;
  lastConflict: boolean;
  hydrate: () => Promise<void>;
  syncNow: () => Promise<void>;
  createProject: (kind: PlaygroundKind, name: string) => Promise<PlaygroundProject>;
  updateProject: (
    localId: string,
    patch: Partial<Pick<PlaygroundProject, 'name' | 'files'>>
  ) => Promise<void>;
  duplicateProject: (localId: string) => Promise<PlaygroundProject | null>;
  deleteProject: (localId: string) => Promise<void>;
  getProject: (localId: string) => PlaygroundProject | undefined;
}

function markDirty(dirtyIds: string[], localId: string): string[] {
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
    if (!useAuthStore.getState().isAuthenticated) return;

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
        merged = merged.map((p) =>
          p.localId === id ? { ...result.project, syncState: 'synced' } : p
        );
      }

      const withState = merged.map((p) => ({
        ...p,
        syncState: (stillDirty.includes(p.localId)
          ? 'pending'
          : p.id
            ? 'synced'
            : 'local') as PlaygroundProject['syncState'],
      }));

      await saveProjects(withState);
      await saveDirtyIds(stillDirty);
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
    const all = await loadProjects();
    const next = [project, ...all];
    const dirty = markDirty(get().dirtyIds, project.localId);
    await saveProjects(next);
    await saveDirtyIds(dirty);
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
    await saveProjects(next);
    await saveDirtyIds(dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
  },

  duplicateProject: async (localId) => {
    const source = (await loadProjects()).find((p) => p.localId === localId && !p.deletedAt);
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
    const all = await loadProjects();
    const next = [copy, ...all];
    const dirty = markDirty(get().dirtyIds, copy.localId);
    await saveProjects(next);
    await saveDirtyIds(dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
    void get().syncNow();
    return copy;
  },

  deleteProject: async (localId) => {
    const all = await loadProjects();
    const now = new Date().toISOString();
    const next = all.map((p) =>
      p.localId === localId
        ? { ...p, deletedAt: now, updatedAt: now, syncState: 'pending' as const }
        : p
    );
    const dirty = markDirty(get().dirtyIds, localId);
    await saveProjects(next);
    await saveDirtyIds(dirty);
    set({ projects: next.filter((p) => !p.deletedAt), dirtyIds: dirty });
    void get().syncNow();
  },

  getProject: (localId) => get().projects.find((p) => p.localId === localId),
}));
