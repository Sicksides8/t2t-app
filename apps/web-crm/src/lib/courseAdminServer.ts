import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FS_COL } from './firestoreCollections';
import { DEFAULT_MODULE_TITLE } from './courseConstants';
import type { Course, CourseModule, Lesson, ModuleLink } from '../types';

export type LessonInput = {
  id?: string;
  title: string;
  videoUrl: string;
  pdfUrl?: string;
  links?: ModuleLink[];
  durationSec: number;
  order: number;
  isFree: boolean;
};

export function sanitizeModuleLinks(input: unknown): ModuleLink[] {
  if (!Array.isArray(input)) return [];
  const cleaned: ModuleLink[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const url = String((raw as { url?: unknown }).url || '').trim();
    if (!url) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    if (url.length > 500) continue;
    const labelRaw = (raw as { label?: unknown }).label;
    const label = typeof labelRaw === 'string' ? labelRaw.trim().slice(0, 80) : '';
    cleaned.push(label ? { label, url } : { url });
    if (cleaned.length >= 25) break;
  }
  return cleaned;
}

export function computeCourseStats(lessons: Pick<Lesson, 'durationSec'>[]) {
  const totalLessons = lessons.length;
  const durationMin = Math.max(1, Math.ceil(lessons.reduce((sum, l) => sum + l.durationSec, 0) / 60));
  return { totalLessons, durationMin };
}

function byOrderAsc<T extends { order?: number }>(a: T, b: T) {
  return (a.order ?? 0) - (b.order ?? 0);
}

export async function fetchCourseCurriculum(db: Firestore, courseId: string) {
  const [courseSnap, modulesSnap, lessonsSnap] = await Promise.all([
    db.collection(FS_COL.courses).doc(courseId).get(),
    db.collection(FS_COL.modules).where('courseId', '==', courseId).get(),
    db.collection(FS_COL.lessons).where('courseId', '==', courseId).get(),
  ]);

  if (!courseSnap.exists) return null;

  const course = { id: courseSnap.id, ...(courseSnap.data() as Omit<Course, 'id'>) } as Course;
  const modules = modulesSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<CourseModule, 'id'>) }))
    .sort(byOrderAsc);
  const lessons = lessonsSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Lesson, 'id'>) }))
    .sort(byOrderAsc);

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
      const pdfUrl = item.pdfUrl ? String(item.pdfUrl).trim() : '';
      const links = sanitizeModuleLinks(item.links);
      return {
        id,
        courseId,
        moduleId: modId,
        title: item.title.trim(),
        videoUrl: item.videoUrl.trim(),
        ...(pdfUrl ? { pdfUrl } : {}),
        ...(links.length > 0 ? { links } : {}),
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
    const docPayload: Record<string, unknown> = { ...lesson, updatedAt: now, createdAt: now };
    if (!lesson.pdfUrl) {
      docPayload.pdfUrl = FieldValue.delete();
    }
    if (!lesson.links || lesson.links.length === 0) {
      docPayload.links = FieldValue.delete();
    }
    batch.set(db.collection(FS_COL.lessons).doc(lesson.id), docPayload, { merge: true });
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
