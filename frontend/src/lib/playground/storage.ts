'use client';

import type { PlaygroundProject } from './types';

const PROJECTS_KEY = 'synapse_playground_projects_v1';
const DIRTY_KEY = 'synapse_playground_dirty_v1';

export function loadProjects(): PlaygroundProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlaygroundProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) => ({
      ...p,
      name: p.name?.trim() || (p.kind === 'python' ? 'Untitled python' : 'Untitled web'),
    }));
  } catch {
    return [];
  }
}

export function saveProjects(projects: PlaygroundProject[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function loadDirtyIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DIRTY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDirtyIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DIRTY_KEY, JSON.stringify(ids));
}
