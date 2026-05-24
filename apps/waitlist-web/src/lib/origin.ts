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

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

function hostsMatch(a: string, b: string): boolean {
  return normalizeHost(a) === normalizeHost(b);
}

/** Host público del request (Netlify/Next suelen usar host interno en request.url). */
function getPublicHost(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-host');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return request.headers.get('host');
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
    process.env.WAITLIST_SITE_URL,
  ]
    .map((v) => toOrigin(v))
    .filter((o): o is string => Boolean(o));

  return [...new Set([...fromList, ...platformOrigins])];
}

function originMatchesPublicHost(request: Request, origin: string): boolean {
  const publicHost = getPublicHost(request);
  if (!publicHost) return false;
  try {
    return hostsMatch(new URL(origin).host, publicHost);
  } catch {
    return false;
  }
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const allowed = getAllowedOrigins();

  if (origin) {
    // Mismo sitio: t2tacademy.online, www., dominio Netlify, etc.
    if (originMatchesPublicHost(request, origin)) return true;
    if (allowed.includes(origin)) return true;
    return false;
  }

  const publicHost = getPublicHost(request);
  if (publicHost) {
    const httpsOrigin = toOrigin(`https://${publicHost}`);
    const httpOrigin = toOrigin(`http://${publicHost}`);
    if (httpsOrigin && allowed.includes(httpsOrigin)) return true;
    if (httpOrigin && allowed.includes(httpOrigin)) return true;
    if (process.env.NODE_ENV !== 'production') return true;
    // POST same-site sin header Origin
    return true;
  }

  return process.env.NODE_ENV !== 'production';
}
