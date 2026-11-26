import { isTauri } from './env';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
  date?: string;
}

export const desktopUpdater = {
  async check(): Promise<UpdateInfo> {
    if (!isTauri()) {
      return { available: false };
    }
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (!update) return { available: false };
      return {
        available: true,
        version: update.version,
        body: update.body ?? undefined,
        date: update.date ?? undefined,
      };
    } catch {
      return { available: false };
    }
  },

  async downloadAndInstall(onProgress?: (percent: number) => void): Promise<boolean> {
    if (!isTauri()) return false;
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const { relaunch } = await import('@tauri-apps/plugin-process');
      const update = await check();
      if (!update) return false;
      let downloaded = 0;
      let contentLength = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          contentLength = event.data.contentLength || 0;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (contentLength > 0 && onProgress) {
            onProgress(Math.min(100, Math.round((downloaded / contentLength) * 100)));
          }
        } else if (event.event === 'Finished' && onProgress) {
          onProgress(100);
        }
      });
      await relaunch();
      return true;
    } catch {
      return false;
    }
  },
};
