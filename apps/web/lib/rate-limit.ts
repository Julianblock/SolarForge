const hits = new Map<string, { count: number; reset: number }>();

/** In-memory limiter for one server process. Use Redis when REDIS_URL is set in a later deployment. */
export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}
