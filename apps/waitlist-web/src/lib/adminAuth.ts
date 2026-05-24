import { timingSafeEqual } from 'crypto';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminAuth(request: Request): boolean {
  const expectedUser = process.env.MAILER_ADMIN_USER;
  const expectedPassword = process.env.MAILER_ADMIN_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return false;
  }

  const header = request.headers.get('authorization');
  if (!header?.startsWith('Basic ')) {
    return false;
  }

  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  } catch {
    return false;
  }

  const colon = decoded.indexOf(':');
  if (colon < 0) return false;

  const user = decoded.slice(0, colon);
  const password = decoded.slice(colon + 1);

  return safeEqual(user, expectedUser) && safeEqual(password, expectedPassword);
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
