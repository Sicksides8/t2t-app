import type { Firestore } from 'firebase-admin/firestore';
import { FS_COL } from './firestoreCollections';
import { DEFAULT_MODULE_TITLE } from './courseConstants';
import type { Course, CourseModule, Lesson } from '../types';

export type LessonInput = {
  id?: string;
  title: string;
  videoUrl: string;
  durationSec: number;
  order: number;
  isFree: boolean;
};

export function computeCourseStats(lessons: Pick<Lesson, 'durationSec'>[]) {
  const totalLessons = lessons.length;
  const durationMin = Math.max(1, Math.ceil(lessons.reduce((sum, l) => sum + l.durationSec, 0) / 60));
  return { totalLessons, durationMin };
}

export async function fetchCourseCurriculum(db: Firestore, courseId: string) {
  const [courseSnap, modulesSnap, lessonsSnap] = await Promise.all([
    db.collection(FS_COL.courses).doc(courseId).get(),
    db.collection(FS_COL.modules).where('courseId', '==', courseId).orderBy('order', 'asc').get(),
    db.collection(FS_COL.lessons).where('courseId', '==', courseId).orderBy('order', 'asc').get(),
  ]);

  if (!courseSnap.exists) return null;

  const course = { id: courseSnap.id, ...(courseSnap.data() as Omit<Course, 'id'>) } as Course;
  const modules = modulesSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<CourseModule, 'id'>) }));
  const lessons = lessonsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Lesson, 'id'>) }));

  return { course, modules, lessons };
}

export async function syncCourseCurriculum(
  db: Firestore,
  courseId: string,
  lessonsInput: LessonInput[],
  moduleTitle = DEFAULT_MODULE_TITLE,
) {
  const now = new Date();
  const modId = `${courseId}_m1`;

  const existingLessons = await db.collection(FS_COL.lessons).where('courseId', '==', courseId).get();
  const incomingIds = new Set(lessonsInput.filter((l) => l.id).map((l) => l.id as string));

  const batch = db.batch();

  for (const doc of existingLessons.docs) {
    if (!incomingIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  }

  const normalizedLessons: Lesson[] = lessonsInput
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item, index) => {
      const order = index + 1;
      const id = item.id || `${modId}_l${order}`;
      return {
        id,
        courseId,
        moduleId: modId,
        title: item.title.trim(),
        videoUrl: item.videoUrl.trim(),
        durationSec: Math.max(30, item.durationSec),
        order,
        isFree: Boolean(item.isFree),
      };
    });

  batch.set(
    db.collection(FS_COL.modules).doc(modId),
    {
      id: modId,
      courseId,
      title: moduleTitle,
      order: 1,
      totalLessons: normalizedLessons.length,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true },
  );

  for (const lesson of normalizedLessons) {
    batch.set(
      db.collection(FS_COL.lessons).doc(lesson.id),
      { ...lesson, updatedAt: now, createdAt: now },
      { merge: true },
    );
  }

  const stats = computeCourseStats(normalizedLessons);
  batch.set(
    db.collection(FS_COL.courses).doc(courseId),
    { ...stats, updatedAt: now },
    { merge: true },
  );

  await batch.commit();
  return { modId, lessons: normalizedLessons, ...stats };
}
