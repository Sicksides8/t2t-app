import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { unauthorizedResponse, verifyAdminAuth } from '@/lib/adminAuth';
import { sendBetaInviteEmail } from '@/lib/email/sendBetaInvite';
import { getAdminDb } from '@/lib/firebase-admin';
import { FS_COL } from '@/lib/firestoreCollections';
import { normalizeAndValidateEmail, waitlistDocId } from '@/lib/validation';

type InviteResult = {
  email: string;
  success: boolean;
  error?: string;
  emailId?: string;
};

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return unauthorizedResponse();
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

  const payload = body as { email?: unknown; emails?: unknown };
  const rawList: unknown[] = [];

  if (typeof payload.email === 'string') {
    rawList.push(payload.email);
  }
  if (Array.isArray(payload.emails)) {
    rawList.push(...payload.emails);
  }

  if (rawList.length === 0) {
    return NextResponse.json({ success: false, error: 'Indicá email o emails' }, { status: 400 });
  }

  if (rawList.length > 25) {
    return NextResponse.json({ success: false, error: 'Máximo 25 correos por solicitud' }, { status: 400 });
  }

  const results: InviteResult[] = [];

  for (const raw of rawList) {
    const validated = normalizeAndValidateEmail(raw);
    if (!validated.ok) {
      results.push({ email: String(raw), success: false, error: 'Correo no válido' });
      continue;
    }

    const docId = waitlistDocId(validated.email);
    const ref = getAdminDb().collection(FS_COL.waitlist).doc(docId);
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set({
        email: validated.email,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        source: 'admin-invite',
      });
    }

    const sendResult = await sendBetaInviteEmail(validated.email);
    if (!sendResult.ok) {
      results.push({ email: validated.email, success: false, error: sendResult.error });
      continue;
    }

    await ref.set(
      {
        email: validated.email,
        status: 'invited',
        invitedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    results.push({ email: validated.email, success: true, emailId: sendResult.id });
  }

  const okCount = results.filter((r) => r.success).length;

  return NextResponse.json({
    success: okCount > 0,
    invited: okCount,
    total: results.length,
    results,
  });
}
