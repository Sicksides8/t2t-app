import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireUser } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  const { code } = await request.json();
  const normalized = String(code || '').trim().toUpperCase();
  const codeRef = adminDb.collection(FS_COL.subscriptionCodes).doc(normalized);
  const snapshot = await codeRef.get();

  if (!snapshot.exists || snapshot.data()?.used) {
    return NextResponse.json({ success: false, error: { message: 'Codigo invalido o ya utilizado' } }, { status: 400 });
  }

  const data = snapshot.data() || {};
  const subscriptionRef = await adminDb.collection(FS_COL.subscriptions).add({
    userId: user.uid,
    planId: data.planId || 'academy',
    status: 'active',
    source: 'code',
    startDate: new Date(),
    endDate: new Date(Date.now() + (data.durationDays || 30) * 24 * 60 * 60 * 1000),
  });

  await codeRef.set({ used: true, usedBy: user.uid, usedAt: new Date() }, { merge: true });
  await adminDb.collection(FS_COL.users).doc(user.uid).set({ subscriptionId: subscriptionRef.id, updatedAt: new Date() }, { merge: true });

  return NextResponse.json({ success: true, data: { subscriptionId: subscriptionRef.id } });
}
