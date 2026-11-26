import { isTauri } from './env';

export const desktopNotifications = {
  async ensurePermission(): Promise<boolean> {
    if (isTauri()) {
      try {
        const mod = await import('@tauri-apps/plugin-notification');
        let granted = await mod.isPermissionGranted();
        if (!granted) {
          const perm = await mod.requestPermission();
          granted = perm === 'granted';
        }
        return granted;
      } catch {
        return false;
      }
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  },

  async notify(title: string, body: string): Promise<void> {
    if (isTauri()) {
      try {
        const mod = await import('@tauri-apps/plugin-notification');
        const granted = await this.ensurePermission();
        if (granted) {
          mod.sendNotification({ title, body });
        }
      } catch {
        // non-fatal
      }
      return;
    }
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {
        // ignore
      }
    }
  },
};
