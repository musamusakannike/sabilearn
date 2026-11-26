import { isTauri } from './env';

const PREFIX = 'sabilearn_kv_';
const STORE_FILENAME = 'sabilearn-store.json';

type TauriStoreHandle = {
  get: <T>(key: string) => Promise<T | undefined>;
  set: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
  clear: () => Promise<void>;
  save: () => Promise<void>;
};

let storePromise: Promise<TauriStoreHandle> | null = null;

async function getTauriStore(): Promise<TauriStoreHandle> {
  if (!storePromise) {
    storePromise = (async () => {
      const { load } = await import('@tauri-apps/plugin-store');
      return (await load(STORE_FILENAME, { autoSave: true })) as unknown as TauriStoreHandle;
    })();
  }
  return storePromise;
}

export const kvStore = {
  async get<T = unknown>(key: string): Promise<T | null> {
    if (isTauri()) {
      try {
        const store = await getTauriStore();
        const val = await store.get<T>(key);
        return val === undefined ? null : val;
      } catch {
        return null;
      }
    }
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    if (isTauri()) {
      try {
        const store = await getTauriStore();
        await store.set(key, value);
        await store.save();
      } catch {
        // ignore store write errors
      }
      return;
    }
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  },

  async remove(key: string): Promise<void> {
    if (isTauri()) {
      try {
        const store = await getTauriStore();
        await store.delete(key);
        await store.save();
      } catch {
        // ignore
      }
      return;
    }
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },

  async keys(): Promise<string[]> {
    if (isTauri()) {
      try {
        const store = await getTauriStore();
        return await store.keys();
      } catch {
        return [];
      }
    }
    const result: string[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
          result.push(k.slice(PREFIX.length));
        }
      }
    } catch {
      // ignore
    }
    return result;
  },

  async estimateBytes(keyPrefix?: string): Promise<number> {
    const allKeys = await this.keys();
    let total = 0;
    for (const k of allKeys) {
      if (keyPrefix && !k.startsWith(keyPrefix)) continue;
      const val = await this.get(k);
      if (val !== null) {
        total += JSON.stringify(val).length * 2;
      }
    }
    return total;
  },

  async clearByPrefix(keyPrefix: string): Promise<void> {
    const allKeys = await this.keys();
    for (const k of allKeys) {
      if (k.startsWith(keyPrefix)) {
        await this.remove(k);
      }
    }
  },
};
