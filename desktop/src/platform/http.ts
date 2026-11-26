import { isTauri } from './env';

/**
 * Platform HTTP fetch:
 * - Tauri: `@tauri-apps/plugin-http` (Rust-side HTTP client, bypasses CORS, supports streaming)
 * - Browser: standard `window.fetch` (uses Vite dev proxy in development)
 */
export async function platformFetch(
  input: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { timeoutMs, signal, ...rest } = init || {};

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  if (timeoutMs && timeoutMs > 0) {
    timer = setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs);
  }

  const onExternalAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  try {
    if (isTauri()) {
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
      return await tauriFetch(input, {
        ...rest,
        signal: controller.signal,
      });
    }
    return await window.fetch(input, {
      ...rest,
      signal: controller.signal,
    });
  } finally {
    if (timer) clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }
}
