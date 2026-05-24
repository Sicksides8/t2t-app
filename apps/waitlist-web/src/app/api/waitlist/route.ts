import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { FirebaseAdminConfigError, getAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { FS_COL } from '@/lib/firestoreCollections';
import { isAllowedOrigin } from '@/lib/origin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sendWaitlistConfirmationEmail } from '@/lib/email/sendWaitlistConfirmation';
import { emailValidationMessage, normalizeAndValidateEmail, waitlistDocId } from '@/lib/validation';

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          'El servidor no tiene credenciales de Firebase. Configurá apps/waitlist-web/.env.local (copiá las variables FIREBASE_* desde el CRM).',
      },
      { status: 503 },
    );
  }

  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Origen no permitido' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`waitlist:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Demasiados intentos. Probá de nuevo más tarde.',
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Solicitud no válida' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Solicitud no válida' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload.website === 'string' && payload.website.trim().length > 0) {
    return NextResponse.json({ success: true, message: '¡Gracias! Te avisaremos cuando haya novedades.' });
  }

  const validated = normalizeAndValidateEmail(payload.email);
  if (!validated.ok) {
    return NextResponse.json(
      { success: false, error: emailValidationMessage(validated.code) },
      { status: 400 },
    );
  }

  const docId = waitlistDocId(validated.email);
  const ref = getAdminDb().collection(FS_COL.waitlist).doc(docId);

  let existing;
  try {
    existing = await ref.get();
  } catch (err) {
    if (err instanceof FirebaseAdminConfigError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    console.error('[waitlist] firestore error:', err);
    return NextResponse.json(
      { success: false, error: 'No pudimos guardar tu registro. Intentá de nuevo en unos minutos.' },
      { status: 500 },
    );
  }

  if (existing.exists) {
    return NextResponse.json({
      success: true,
      message: '¡Ya estás en la lista! Te contactaremos pronto.',
      alreadyRegistered: true,
    });
  }

  await ref.set({
    email: validated.email,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    source: typeof payload.source === 'string' ? payload.source.slice(0, 64) : 'landing',
  });

  const confirmation = await sendWaitlistConfirmationEmail(validated.email);
  if (!confirmation.ok) {
    console.error('[waitlist] confirmation email failed:', confirmation.error);
  }

  return NextResponse.json({
    success: true,
    message: '¡Listo! Te notificaremos por email cuando tu acceso esté listo.',
  });
}
