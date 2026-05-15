import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { requireUser } from '../../../lib/authHelper';
import { FS_COL } from '../../../lib/firestoreCollections';

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  const { courseId } = await request.json();
  const id = `${user.uid}_${courseId}`;
  await adminDb.collection(FS_COL.enrollments).doc(id).set(
    {
      userId: user.uid,
      courseId,
      enrolledAt: new Date(),
      updatedAt: new Date(),
    },
    { merge: true },
  );
  return NextResponse.json({ success: true, data: { id } }, { status: 201 });
}
