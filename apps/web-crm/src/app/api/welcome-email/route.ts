import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/authHelper';
import { sendWelcomeEmail } from '../../../lib/email/sendWelcomeEmail';
import { adminDb } from '../../../lib/firebase-admin';
import { FS_COL } from '../../../lib/firestoreCollections';
import { handleRouteError } from '../../../lib/routeError';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const ref = adminDb.collection(FS_COL.users).doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: { message: 'profile_not_found' } }, { status: 404 });
    }

    const data = snap.data() || {};
    if (data.welcomeEmailSentAt) {
      return NextResponse.json({ success: true, data: { alreadySent: true } });
    }

    const to = typeof data.email === 'string' && data.email.trim().length > 0 ? data.email.trim() : user.email;
    if (!to) {
      return NextResponse.json({ success: false, error: { message: 'email_missing' } }, { status: 400 });
    }

    const displayName = typeof data.displayName === 'string' && data.displayName.trim().length > 0
      ? data.displayName.trim()
      : 'Alumno T2T';

    const result = await sendWelcomeEmail({ to, displayName });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: { message: result.error } }, { status: 502 });
    }

    await ref.set({ welcomeEmailSentAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ success: true, data: { id: result.id } });
  } catch (err) {
    return handleRouteError(err);
  }
}
