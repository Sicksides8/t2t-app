import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireUser } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  const snapshot = await adminDb.collection(FS_COL.subscriptions).where('userId', '==', user.uid).where('status', '==', 'active').limit(1).get();
  const data = snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  return NextResponse.json({ success: true, data });
}
