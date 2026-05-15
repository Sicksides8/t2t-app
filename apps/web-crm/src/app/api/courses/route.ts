import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../lib/authHelper';
import { adminDb } from '../../../lib/firebase-admin';
import { seedCourses } from '../../../lib/seed';
import { FS_COL } from '../../../lib/firestoreCollections';
import { handleRouteError } from '../../../lib/routeError';

export async function GET(request: NextRequest) {
  const skillId = request.nextUrl.searchParams.get('skillId');
  try {
    let query = adminDb.collection(FS_COL.courses).where('isActive', '==', true).orderBy('order', 'asc');
    if (skillId) {
      query = adminDb.collection(FS_COL.courses).where('isActive', '==', true).where('skillId', '==', skillId).orderBy('order', 'asc');
    }
    const snapshot = await query.get();
    const data = snapshot.empty ? seedCourses : snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data });
  } catch {
    const data = skillId ? seedCourses.filter((course) => course.skillId === skillId) : seedCourses;
    return NextResponse.json({ success: true, data });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const ref = await adminDb.collection(FS_COL.courses).add({ ...body, createdAt: new Date(), updatedAt: new Date() });
    return NextResponse.json({ success: true, data: { id: ref.id } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
