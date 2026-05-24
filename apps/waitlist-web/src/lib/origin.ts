export function isAllowedOrigin(request: Request): boolean {
  const allowed = (process.env.WAITLIST_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    return true;
  }

  const origin = request.headers.get('origin');
  if (!origin) {
    return process.env.NODE_ENV !== 'production';
  }

  return allowed.includes(origin);
}
