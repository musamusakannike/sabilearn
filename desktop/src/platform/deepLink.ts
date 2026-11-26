import { isTauri } from './env';

export type DeepLinkHandler = (url: string) => void;

export function isValidSabilearnDeepLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'sabilearn:';
  } catch {
    return false;
  }
}

export async function listenDeepLinks(handler: DeepLinkHandler): Promise<() => void> {
  if (!isTauri()) {
    return () => {};
  }

  const unsubs: Array<() => void> = [];

  try {
    const { getCurrent, onOpenUrl } = await import('@tauri-apps/plugin-deep-link');
    const initial = await getCurrent();
    if (initial && initial.length > 0) {
      for (const u of initial) {
        if (isValidSabilearnDeepLink(u)) handler(u);
      }
    }
    const unlistenPlugin = await onOpenUrl((urls) => {
      for (const u of urls) {
        if (isValidSabilearnDeepLink(u)) handler(u);
      }
    });
    unsubs.push(unlistenPlugin);
  } catch {
    // plugin unavailable in dev environment
  }

  try {
    const { listen } = await import('@tauri-apps/api/event');
    const unlistenSingleInstance = await listen<string>('deep-link-received', (event) => {
      if (typeof event.payload === 'string' && isValidSabilearnDeepLink(event.payload)) {
        handler(event.payload);
      }
    });
    unsubs.push(unlistenSingleInstance);
  } catch {
    // ignore
  }

  return () => {
    for (const u of unsubs) {
      try {
        u();
      } catch {
        // ignore
      }
    }
  };
}
