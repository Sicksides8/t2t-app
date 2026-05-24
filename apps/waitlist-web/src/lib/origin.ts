/** Dominio público de la waitlist en producción. */
const PRODUCTION_SITE_ORIGINS = ['https://t2tacademy.online', 'https://www.t2tacademy.online'];

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

function expandWithWwwVariant(origin: string): string[] {
  try {
    const url = new URL(origin);
    const variants = [origin];
    if (!url.hostname.startsWith('www.')) {
      const www = toOrigin(`https://www.${url.hostname}`);
      if (www) variants.push(www);
    } else {
      const apex = toOrigin(`https://${url.hostname.slice(4)}`);
      if (apex) variants.push(apex);
    }
    return variants;
  } catch {
    return [origin];
  }
}

function originsFromEnvValue(value: string | undefined): string[] {
  const origin = toOrigin(value);
  if (!origin) return [];
  return expandWithWwwVariant(origin);
}

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

function hostsMatch(a: string, b: string): boolean {
  return normalizeHost(a) === normalizeHost(b);
}

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
    .flatMap((entry) => originsFromEnvValue(entry.trim()))
    .filter(Boolean);

  const platformValues = [
    process.env.URL,
    process.env.DEPLOY_URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.NETLIFY_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.WAITLIST_SITE_URL,
  ];

  const platformOrigins = platformValues.flatMap((v) => originsFromEnvValue(v));

  return [...new Set([...PRODUCTION_SITE_ORIGINS, ...fromList, ...platformOrigins])];
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
    if (originMatchesPublicHost(request, origin)) return true;
    if (allowed.includes(origin)) return true;
    return false;
  }

  const publicHost = getPublicHost(request);
  if (publicHost) {
    if (process.env.NODE_ENV !== 'production') return true;
    const httpsOrigin = toOrigin(`https://${publicHost}`);
    if (httpsOrigin && allowed.includes(httpsOrigin)) return true;
    if (hostsMatch(publicHost, 't2tacademy.online')) return true;
    return true;
  }

  return process.env.NODE_ENV !== 'production';
}
