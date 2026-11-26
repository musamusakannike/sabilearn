import { beforeEach, describe, expect, it } from 'vitest';
import { getQueuedSessions, queueSession } from '../offlineSync';
import { mergeProjects } from '../playgroundSync';
import { PlaygroundProject } from '../types';

describe('offlineSync queue & playground merge', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('compacts mutations by dedupeKey and removes cancelled mutations via cancelDedupeKey', async () => {
    await queueSession('/progress/assessment/ch1', { currentIndex: 1 }, { method: 'PUT', dedupeKey: 'assessment_progress_ch1' });
    await queueSession('/progress/assessment/ch1', { currentIndex: 2 }, { method: 'PUT', dedupeKey: 'assessment_progress_ch1' });

    let q = await getQueuedSessions();
    expect(q).toHaveLength(1);
    expect(q[0].data).toEqual({ currentIndex: 2 });

    await queueSession(
      '/progress/assessment/ch1',
      {},
      { method: 'DELETE', cancelDedupeKey: 'assessment_progress_ch1', dedupeKey: 'clear_ch1' }
    );
    q = await getQueuedSessions();
    expect(q).toHaveLength(1);
    expect(q[0].method).toBe('DELETE');
  });

  it('merges playground projects using last-write-wins by updatedAt', () => {
    const local: PlaygroundProject[] = [
      {
        localId: 'p1',
        name: 'Local Older',
        kind: 'python',
        files: { 'main.py': 'print(1)' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
      {
        localId: 'p2',
        name: 'Local Newer',
        kind: 'web',
        files: { 'index.html': '<h1>v2</h1>' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-05T00:00:00Z',
      },
    ];
    const remote: PlaygroundProject[] = [
      {
        id: 'srv1',
        localId: 'p1',
        name: 'Remote Newer',
        kind: 'python',
        files: { 'main.py': 'print(2)' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-04T00:00:00Z',
      },
      {
        id: 'srv2',
        localId: 'p2',
        name: 'Remote Older',
        kind: 'web',
        files: { 'index.html': '<h1>v1</h1>' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-03T00:00:00Z',
      },
    ];

    const merged = mergeProjects(local, remote);
    const p1 = merged.find((p) => p.localId === 'p1');
    const p2 = merged.find((p) => p.localId === 'p2');
    expect(p1?.name).toBe('Remote Newer');
    expect(p1?.id).toBe('srv1');
    expect(p2?.name).toBe('Local Newer');
    expect(p2?.id).toBe('srv2');
  });
});
