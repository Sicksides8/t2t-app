import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { seedPlans } from '../../../lib/seed';
import { FS_COL } from '../../../lib/firestoreCollections';

export async function GET() {
  try {
    const snapshot = await adminDb.collection(FS_COL.plans).where('isActive', '==', true).get();
    const data = snapshot.empty ? seedPlans : snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: true, data: seedPlans });
  }
}
