import { isTauri } from './env';

const DEV_STORAGE_KEY = 'sabilearn_dev_jwt_token';

/**
 * Secure token storage:
 * - Tauri: OS keychain via Rust `keyring` commands (`keychain_get`, `keychain_set`, `keychain_delete`)
 * - Browser (dev-only fallback): localStorage
 */
export const secureStore = {
  isDevFallback: () => !isTauri(),

  async getToken(): Promise<string | null> {
    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const value = await invoke<string | null>('keychain_get', { key: 'jwt_token' });
        return value || null;
      } catch {
        return null;
      }
    }
    try {
      return window.localStorage.getItem(DEV_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('keychain_set', { key: 'jwt_token', value: token });
      return;
    }
    try {
      window.localStorage.setItem(DEV_STORAGE_KEY, token);
    } catch {
      // ignore storage quota errors in dev fallback
    }
  },

  async deleteToken(): Promise<void> {
    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('keychain_delete', { key: 'jwt_token' });
      } catch {
        // ignore if absent
      }
      return;
    }
    try {
      window.localStorage.removeItem(DEV_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
