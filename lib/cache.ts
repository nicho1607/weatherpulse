/**
 * Minimal in-memory cache with per-entry TTL.
 *
 * Intended for the server-side API proxy so repeated lookups for the same
 * city/coordinates do not hammer the external Open-Meteo service. The cache
 * lives in the module scope of the server process; it is not shared across
 * serverless invocations, which is acceptable for a basic caching layer.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/** Default time-to-live: 10 minutes. */
export const DEFAULT_TTL = 600_000;

/**
 * Returns the cached value for `key`, or `null` when it is missing or expired.
 * Expired entries are deleted on read.
 */
export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value as T;
}

/**
 * Stores `value` under `key` for `ttl` milliseconds (default 10 minutes).
 */
export function setCached<T>(key: string, value: T, ttl: number = DEFAULT_TTL): void {
  store.set(key, { value, expiresAt: Date.now() + ttl });
}
