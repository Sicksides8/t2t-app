import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { seedCourses } from '../../../../lib/seed';
import { FS_COL } from '../../../../lib/firestoreCollections';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const snapshot = await adminDb.collection(FS_COL.courses).doc(id).get();
    if (snapshot.exists) {
      return NextResponse.json({ success: true, data: { id: snapshot.id, ...snapshot.data() } });
    }
  } catch {
    // Fallback below keeps first builds usable without Firebase credentials.
  }
  const course = seedCourses.find((item) => item.id === id);
  return course ? NextResponse.json({ success: true, data: course }) : NextResponse.json({ success: false, error: { message: 'Course not found' } }, { status: 404 });
}
