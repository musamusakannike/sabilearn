import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlaygroundProject } from './types';

const PROJECTS_KEY = 'playground_projects_v1';
const DIRTY_KEY = 'playground_dirty_v1';

export async function loadProjects(): Promise<PlaygroundProject[]> {
  const raw = await AsyncStorage.getItem(PROJECTS_KEY);
  if (!raw) return [];
  try {
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

export async function saveProjects(projects: PlaygroundProject[]): Promise<void> {
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function loadDirtyIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DIRTY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDirtyIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(DIRTY_KEY, JSON.stringify(ids));
}
