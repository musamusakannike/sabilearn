import { isTauri } from './env';

export const desktopWindow = {
  async minimize(): Promise<void> {
    if (!isTauri()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().minimize();
  },

  async toggleMaximize(): Promise<void> {
    if (!isTauri()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().toggleMaximize();
  },

  async close(): Promise<void> {
    if (!isTauri()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  },

  async startDragging(): Promise<void> {
    if (!isTauri()) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().startDragging();
  },

  async setKeepAwake(enabled: boolean): Promise<void> {
    if (!isTauri()) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_keep_awake', { enabled });
    } catch {
      // non-fatal
    }
  },

  async setCloseToTray(enabled: boolean): Promise<void> {
    if (!isTauri()) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_close_to_tray', { enabled });
    } catch {
      // non-fatal
    }
  },

  async listenTrayEvents(onStudyNow: () => void): Promise<() => void> {
    if (!isTauri()) return () => {};
    try {
      const { listen } = await import('@tauri-apps/api/event');
      const unlisten = await listen('tray-study-now', () => onStudyNow());
      return unlisten;
    } catch {
      return () => {};
    }
  },
};
