'use client';

import api from '@/lib/api';
import type { PlaygroundProject } from './types';

function asProject(raw: PlaygroundProject & { id?: string }): PlaygroundProject {
  return {
    id: raw.id,
    localId: raw.localId,
    name: raw.name?.trim() || (raw.kind === 'python' ? 'Untitled python' : 'Untitled web'),
    kind: raw.kind,
    files: raw.files || {},
    deletedAt: raw.deletedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    syncState: 'synced',
  };
}

export async function pullRemoteProjects(): Promise<PlaygroundProject[] | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  try {
    const res = await api.get('/playground/projects', {
      params: { full: 1, includeDeleted: 1 },
    });
    const list = (res.data?.data || []) as PlaygroundProject[];
    return list.map(asProject);
  } catch {
    return null;
  }
}

export async function pushProject(project: PlaygroundProject): Promise<{
  project: PlaygroundProject;
  conflict: boolean;
} | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  try {
    const name = project.name?.trim() || (project.kind === 'python' ? 'Untitled python' : 'Untitled web');
    const res = await api.put('/playground/projects', {
      localId: project.localId,
      name,
      kind: project.kind,
      files: project.files,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt ?? null,
    });
    const data = res.data?.data as PlaygroundProject;
    return {
      project: asProject(data),
      conflict: !!res.data?.conflict,
    };
  } catch {
    return null;
  }
}

export function mergeProjects(local: PlaygroundProject[], remote: PlaygroundProject[]): PlaygroundProject[] {
  const byLocal = new Map<string, PlaygroundProject>();
  for (const p of local) byLocal.set(p.localId, p);
  for (const r of remote) {
    const l = byLocal.get(r.localId);
    if (!l) {
      byLocal.set(r.localId, r);
      continue;
    }
    const lt = Date.parse(l.updatedAt) || 0;
    const rt = Date.parse(r.updatedAt) || 0;
    byLocal.set(r.localId, rt >= lt ? { ...r, id: r.id || l.id } : { ...l, id: r.id || l.id });
  }
  return Array.from(byLocal.values()).sort(
    (a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0)
  );
}
