// Sliding-window limiter kept in this server process's memory. It stops a user hammering a paid API from one
// instance; it is not shared across instances or restarts, so move it to the database if hard limits are needed.

const hits = new Map<string, number[]>();

/** Gives back the most recent turn of `key`, for a request that failed through no fault or cost of the user. */
export function releaseRateLimit(key: string): void {
  const recent = hits.get(key);
  if (recent && recent.length > 0) hits.set(key, recent.slice(0, -1));
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { allowed: false, retryAfterMs: windowMs - (now - recent[0]) };
  }
  hits.set(key, [...recent, now]);
  return { allowed: true };
}
