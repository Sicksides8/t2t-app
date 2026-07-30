import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireUser } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  const body = await request.json();
  const courseId = body?.courseId as string | undefined;
  const lessonId = body?.lessonId as string | undefined;
  const totalLessonsFromClient =
    typeof body?.totalLessons === 'number' && body.totalLessons > 0 ? body.totalLessons : null;
  const percentFromClient =
    typeof body?.percentComplete === 'number' ? body.percentComplete : null;

  if (!courseId || !lessonId) {
    return NextResponse.json(
      { success: false, error: { message: 'courseId y lessonId son requeridos' } },
      { status: 400 },
    );
  }

  const ref = adminDb
    .collection(FS_COL.progress)
    .doc(user.uid)
    .collection(FS_COL.progressCoursesSub)
    .doc(courseId);
  const current = await ref.get();
  const lessonsCompleted = new Set<string>(
    current.exists ? current.data()?.lessonsCompleted || [] : [],
  );
  lessonsCompleted.add(lessonId);

  let totalLessons = totalLessonsFromClient;
  if (!totalLessons) {
    const lessonsSnap = await adminDb
      .collection(FS_COL.lessons)
      .where('courseId', '==', courseId)
      .get();
    totalLessons = Math.max(1, lessonsSnap.size);
  }

  const computedPercent = Math.min(
    100,
    Math.round((lessonsCompleted.size / totalLessons) * 100),
  );
  const percentComplete =
    percentFromClient != null ? Math.max(percentFromClient, computedPercent) : computedPercent;

  await ref.set(
    {
      courseId,
      currentLessonId: lessonId,
      lessonsCompleted: Array.from(lessonsCompleted),
      percentComplete,
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

  return NextResponse.json({ success: true, data: { percentComplete } });
}
