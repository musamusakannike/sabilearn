import { isTauri } from './env';

export const clipboard = {
  async writeText(text: string): Promise<boolean> {
    if (isTauri()) {
      try {
        const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
        await writeText(text);
        return true;
      } catch {
        // fallback below
      }
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },
};
