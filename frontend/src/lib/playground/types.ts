export type PlaygroundKind = 'web' | 'python';

export interface PlaygroundProject {
  id?: string;
  localId: string;
  name: string;
  kind: PlaygroundKind;
  files: Record<string, string>;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  syncState?: 'synced' | 'pending' | 'local';
}
