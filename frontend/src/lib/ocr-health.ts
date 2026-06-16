/**
 * OCR Microservice Health Utility
 *
 * Manages wake-up pings for the Render-hosted OCR microservice.
 * Because the free tier spins down after inactivity, we ping early
 * (on app open) and gate uploads behind a confirmed-healthy status.
 *
 * A shared singleton promise ensures only one in-flight check runs
 * at a time — no duplicate network requests.
 */

export type OcrHealthStatus = "unknown" | "checking" | "awake" | "asleep" | "unconfigured";

let _status: OcrHealthStatus = "unknown";
let _lastCheckTime = 0;
let _inflightPromise: Promise<OcrHealthStatus> | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — don't re-ping if recently confirmed awake

/** Read the current cached status without triggering a check. */
export function getOcrHealthStatus(): OcrHealthStatus {
  return _status;
}

/** Subscribe to status changes (simple callback pattern). */
const _listeners = new Set<(s: OcrHealthStatus) => void>();

export function onOcrHealthChange(fn: (s: OcrHealthStatus) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function _setStatus(s: OcrHealthStatus) {
  _status = s;
  _listeners.forEach((fn) => fn(s));
}

/**
 * Ping the health endpoint once.
 * Returns true if the service is awake, false otherwise.
 */
async function _pingOnce(): Promise<boolean> {
  try {
    const res = await fetch("/api/documents/health", {
      method: "GET",
      // Don't cache — we need a live response
      headers: { "Cache-Control": "no-store" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check OCR health, returning the resolved status.
 *
 * - If the service was confirmed awake within the last 5 minutes, returns "awake" immediately.
 * - Deduplicates concurrent calls — multiple callers get the same promise.
 * - On "asleep" result, callers can call `waitForOcrAwake` to poll with retries.
 */
export async function checkOcrHealth(): Promise<OcrHealthStatus> {
  // If already awake and cache is fresh, skip the network call
  if (_status === "awake" && Date.now() - _lastCheckTime < CACHE_TTL_MS) {
    return "awake";
  }

  // Deduplicate concurrent checks
  if (_inflightPromise) return _inflightPromise;

  _inflightPromise = (async (): Promise<OcrHealthStatus> => {
    _setStatus("checking");
    const awake = await _pingOnce();
    const next: OcrHealthStatus = awake ? "awake" : "asleep";
    _setStatus(next);
    if (awake) _lastCheckTime = Date.now();
    _inflightPromise = null;
    return next;
  })();

  return _inflightPromise;
}

/**
 * Wait until the OCR service is confirmed awake, retrying every `intervalMs`.
 *
 * Gives up after `maxAttempts` retries so uploads don't block indefinitely
 * when the service is genuinely down. The document will be saved with
 * ocrStatus "processing" and the server-side watchdog cron will requeue it.
 *
 * @param intervalMs   How long to wait between retries (default 10 000 ms)
 * @param onAttempt    Called before each retry attempt with the attempt number (1-based)
 * @param signal       AbortSignal to cancel waiting
 * @param maxAttempts  Maximum number of attempts before giving up (default 6 = ~1 min)
 */
export async function waitForOcrAwake(
  intervalMs = 10_000,
  onAttempt?: (attempt: number) => void,
  signal?: AbortSignal,
  maxAttempts = 6
): Promise<boolean> {
  let attempt = 0;

  while (!signal?.aborted && attempt < maxAttempts) {
    attempt++;
    onAttempt?.(attempt);

    // Force a fresh check (bypass cache on retries)
    _lastCheckTime = 0;
    const status = await checkOcrHealth();
    if (status === "awake") return true;

    if (attempt >= maxAttempts) break;

    // Wait before retrying
    await new Promise<void>((resolve, reject) => {
      const tid = setTimeout(resolve, intervalMs);
      signal?.addEventListener("abort", () => {
        clearTimeout(tid);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }

  return false;
}

/** Convenience: fire-and-forget ping on app load (swallows errors). */
export function warmUpOcr(): void {
  if (_status === "awake" && Date.now() - _lastCheckTime < CACHE_TTL_MS) return;
  checkOcrHealth().catch(() => {});
}
