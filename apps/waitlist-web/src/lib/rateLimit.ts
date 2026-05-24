type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function windowMs(): number {
  const minutes = Number(process.env.WAITLIST_RATE_LIMIT_WINDOW_MINUTES) || 60;
  return minutes * 60 * 1000;
}

function maxRequests(): number {
  const max = Number(process.env.WAITLIST_RATE_LIMIT_MAX);
  return Number.isFinite(max) && max > 0 ? max : 5;
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs() });
    return { allowed: true };
  }

  if (existing.count >= maxRequests()) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}
