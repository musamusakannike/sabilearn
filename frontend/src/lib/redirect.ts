import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/** True only on the client after hydration; false during SSR/hydration (no setState-in-effect). */
export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Validated `?redirect=` param (null when absent/unsafe). Empty during SSR/hydration. */
export function useRedirectParam(): string | null {
  const value = useSyncExternalStore(
    noopSubscribe,
    () => getRedirectFromLocation(''),
    () => ''
  );
  return value || null;
}

/**
 * Validates a post-auth redirect target. Only same-origin relative paths are allowed,
 * which blocks open-redirect attempts such as `//evil.com`, `https://evil.com`
 * or `/\evil.com`.
 */
export function getSafeRedirect(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback;
  return raw;
}

/** Reads and validates the `?redirect=` query param from the current browser URL. */
export function getRedirectFromLocation(fallback = '/dashboard'): string {
  if (typeof window === 'undefined') return fallback;
  return getSafeRedirect(new URLSearchParams(window.location.search).get('redirect'), fallback);
}

/** Builds an auth URL that carries the redirect target forward (null when none). */
export function withRedirect(path: string, redirect: string | null): string {
  return redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;
}
