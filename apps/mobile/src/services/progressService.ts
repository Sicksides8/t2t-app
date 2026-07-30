import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { auth, db } from './firebase';
import { apiFetch, hasApiBaseUrl } from './api';
import { tryApi } from './dataSource';
import type { CourseProgress } from '../types';
import { buildLessonCompleteProgress } from '../utils/courseProgress';

function progressDocRef(userId: string, courseId: string) {
  return doc(db, FS_COL.progress, userId, FS_COL.progressCoursesSub, courseId);
}

export async function saveProgressToFirestore(userId: string, progress: CourseProgress): Promise<void> {
  try {
    await setDoc(
      progressDocRef(userId, progress.courseId),
      {
        courseId: progress.courseId,
        currentLessonId: progress.currentLessonId,
        lessonsCompleted: progress.lessonsCompleted,
        percentComplete: progress.percentComplete,
        ...(progress.skillImpactApplied ? { skillImpactApplied: true } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    /* offline */
  }
}

export async function markSkillImpactApplied(courseId: string): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  try {
    await setDoc(
      progressDocRef(userId, courseId),
      { skillImpactApplied: true, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    /* offline */
  }
}

export async function completeLesson(
  courseId: string,
  lessonId: string,
  progress?: CourseProgress,
  totalLessons?: number,
): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (userId && progress) {
    await saveProgressToFirestore(userId, progress);
  }

  await tryApi(() =>
    apiFetch('/api/progress/lesson-complete', {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        lessonId,
        totalLessons,
        percentComplete: progress?.percentComplete,
      }),
    }),
  );
}

export async function enrollInCourse(courseId: string): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (userId) {
    try {
      const ref = progressDocRef(userId, courseId);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        // Ya inscripto: no pisar lessonsCompleted ni percentComplete (merge parcial).
        await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await setDoc(ref, {
          courseId,
          lessonsCompleted: [],
          percentComplete: 0,
          enrolledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      /* offline */
    }
  }

  if (!hasApiBaseUrl()) return;
  await tryApi(() =>
    apiFetch('/api/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    }),
  );
}

export function localProgressUpdate(
  prev: CourseProgress | undefined,
  courseId: string,
  lessonId: string,
  totalLessonsEstimate: number,
): CourseProgress {
  return buildLessonCompleteProgress(prev, courseId, lessonId, totalLessonsEstimate);
}
