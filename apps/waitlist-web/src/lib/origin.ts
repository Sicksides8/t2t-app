function toOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  try {
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(): string[] {
  const fromList = (process.env.WAITLIST_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => toOrigin(o))
    .filter((o): o is string => Boolean(o));

  const platformOrigins = [
    process.env.URL,
    process.env.DEPLOY_URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.NETLIFY_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]
    .map((v) => toOrigin(v))
    .filter((o): o is string => Boolean(o));

  return [...new Set([...fromList, ...platformOrigins])];
}

function isSameHostAsRequest(request: Request, origin: string): boolean {
  try {
    const requestHost = new URL(request.url).host;
    const originHost = new URL(origin).host;
    return requestHost === originHost;
  } catch {
    return false;
  }
}

export function isAllowedOrigin(request: Request): boolean {
  const allowed = getAllowedOrigins();
  const origin = request.headers.get('origin');

  if (origin) {
    if (allowed.includes(origin)) return true;
    if (isSameHostAsRequest(request, origin)) return true;
    return false;
  }

  // Sin header Origin (algunos clientes): permitir si el host coincide con el deploy
  const host = request.headers.get('host');
  if (host) {
    const hostOrigin = toOrigin(`https://${host}`);
    if (hostOrigin && allowed.includes(hostOrigin)) return true;
    if (process.env.NODE_ENV !== 'production') return true;
    try {
      return host === new URL(request.url).host;
    } catch {
      return false;
    }
  }

  return process.env.NODE_ENV !== 'production';
}
