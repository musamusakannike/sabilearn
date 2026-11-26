import { isTauri, platformFetch } from '@/platform';

const DEFAULT_ORIGIN = 'https://api.sabilearn.online';

function getHealthUrl(): string {
  if (!isTauri() && import.meta.env.DEV) {
    return '/health';
  }
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  if (configured) {
    try {
      return `${new URL(configured).origin}/health`;
    } catch {
      return `${DEFAULT_ORIGIN}/health`;
    }
  }
  return `${DEFAULT_ORIGIN}/health`;
}

let lastCheckAt = 0;
let lastKnownOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

/**
 * Combines `navigator.onLine` with a lightweight `/health` heartbeat (cached 10s)
 * because `navigator.onLine` frequently returns true on captive portals or dropped Wi-Fi.
 */
export async function checkOnline(force = false): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    lastKnownOnline = false;
    lastCheckAt = Date.now();
    return false;
  }

  const now = Date.now();
  if (!force && now - lastCheckAt < 10_000) {
    return lastKnownOnline;
  }

  try {
    const res = await platformFetch(getHealthUrl(), {
      method: 'GET',
      timeoutMs: 4000,
    });
    lastKnownOnline = res.ok || res.status < 500;
  } catch {
    lastKnownOnline = false;
  }
  lastCheckAt = Date.now();
  return lastKnownOnline;
}

export function markOnlineState(online: boolean): void {
  lastKnownOnline = online;
  lastCheckAt = Date.now();
}
