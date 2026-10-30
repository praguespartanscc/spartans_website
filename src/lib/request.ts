import 'server-only';

// Helpers for route handlers that browsers call directly.

// True when the request comes from a page on this site (or a preview deployment of it).
// Browsers always send Origin on cross-site POSTs, so a missing header is treated as same-site
// only for non-browser callers that cannot carry a session cookie anyway.
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// The caller's address on Vercel (first hop of x-forwarded-for), or "unknown".
export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

// A small in-memory limiter: at most `limit` calls per `windowMs` for one key. Each serverless
// instance keeps its own counts, so this is a brake on bursts, not an exact quota.
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    if (buckets.size > 5000) buckets.clear();
    buckets.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  b.n += 1;
  return b.n > limit;
}
