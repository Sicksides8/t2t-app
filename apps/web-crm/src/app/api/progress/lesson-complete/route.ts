import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireUser } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  const { courseId, lessonId } = await request.json();
  const ref = adminDb.collection(FS_COL.progress).doc(user.uid).collection(FS_COL.progressCoursesSub).doc(courseId);
  const current = await ref.get();
  const lessonsCompleted = new Set<string>(current.exists ? current.data()?.lessonsCompleted || [] : []);
  lessonsCompleted.add(lessonId);

  await ref.set(
    {
      courseId,
      currentLessonId: lessonId,
      lessonsCompleted: Array.from(lessonsCompleted),
      percentComplete: Math.min(100, lessonsCompleted.size * 20),
      updatedAt: new Date(),
    },
    { merge: true },
  );

  await adminDb.collection(FS_COL.coinsTransactions).add({
    userId: user.uid,
    amount: 10,
    type: 'earned',
    reason: 'lesson_completed',
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}
