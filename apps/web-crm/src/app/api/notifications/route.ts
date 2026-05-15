import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/authHelper';
import { FS_COL } from '../../../lib/firestoreCollections';

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  const snapshot = await adminDb.collection(FS_COL.notifications).where('userId', '==', user.uid).orderBy('createdAt', 'desc').limit(50).get();
  return NextResponse.json({ success: true, data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
}
