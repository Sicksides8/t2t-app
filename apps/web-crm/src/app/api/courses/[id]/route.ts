import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { FS_COL } from '../../../../lib/firestoreCollections';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const snapshot = await adminDb.collection(FS_COL.courses).doc(id).get();
    if (snapshot.exists) {
      return NextResponse.json({ success: true, data: { id: snapshot.id, ...snapshot.data() } });
    }
    return NextResponse.json({ success: false, error: { message: 'Course not found' } }, { status: 404 });
  } catch (error) {
    console.error(`[GET /api/courses/${id}] firestore error`, error);
    return NextResponse.json({ success: false, error: { message: 'No pudimos leer el curso' } }, { status: 500 });
  }
}
