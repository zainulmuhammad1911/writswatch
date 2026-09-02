/**
 * Fixed-window rate limiting, held in process memory.
 *
 * Good enough for one server, which is what the PRD describes for this phase.
 * It is NOT good enough behind more than one instance: each process keeps its
 * own counters, so N instances allow N times the limit, and a serverless
 * deployment resets them on every cold start. Moving to Redis or Upstash means
 * replacing the body of `hit` and nothing else.
 */

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the current window ends. */
  resetAt: number;
  retryAfterSeconds: number;
}

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

/** Limits from the PRD, section 9. */
export const LIMITS = {
  login: { max: 5, windowMs: 15 * 60_000 },
  api: { max: 100, windowMs: 60_000 },
  upload: { max: 20, windowMs: 60_000 },
} as const;

export type LimitName = keyof typeof LIMITS;

export function hit(name: LimitName, identifier: string): RateLimitResult {
  const { max, windowMs } = LIMITS[name];
  const key = `${name}:${identifier}`;
  const now = Date.now();

  sweep(now);

  const existing = buckets.get(key);
  const window =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

  window.count += 1;
  buckets.set(key, window);

  const remaining = Math.max(0, max - window.count);
  return {
    ok: window.count <= max,
    limit: max,
    remaining,
    resetAt: window.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
  };
}

/** Undo a hit. Used when a login succeeds, so a correct password is not counted. */
export function forgive(name: LimitName, identifier: string): void {
  const key = `${name}:${identifier}`;
  const window = buckets.get(key);
  if (window && window.count > 0) window.count -= 1;
}

let lastSweep = 0;
/** Drops expired windows so the map cannot grow without bound. */
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Best-effort client IP.
 *
 * Only trusted because this sits behind a proxy that sets these headers. On a
 * bare server a client can forge x-forwarded-for, which would let it dodge the
 * login limit by rotating the value, so whatever fronts this in production
 * must overwrite the header rather than append to it.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.ok ? {} : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}
