/**
 * Small in-memory token bucket.
 *
 * Per-instance rather than global, since serverless instances do not share
 * memory — this is a guard against a single client hammering one warm instance,
 * not a distributed quota. A real quota would need Redis, which is more moving
 * parts than a hackathon tool with no auth warrants.
 */
const BUCKET = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = BUCKET.get(key);

  if (!entry || now > entry.resetAt) {
    BUCKET.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (BUCKET.size > 5000) sweep(now);
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

function sweep(now: number): void {
  for (const [key, value] of BUCKET) {
    if (now > value.resetAt) BUCKET.delete(key);
  }
}

export function clientKey(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "anonymous"
  );
}
