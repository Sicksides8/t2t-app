import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { auth, db } from './firebase';
import { apiFetch, hasApiBaseUrl } from './api';
import { tryApi } from './dataSource';
import type { CourseProgress } from '../types';

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
        updatedAt: serverTimestamp(),
      },
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
): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (userId && progress) {
    await saveProgressToFirestore(userId, progress);
  }

  await tryApi(() =>
    apiFetch('/api/progress/lesson-complete', {
      method: 'POST',
      body: JSON.stringify({ courseId, lessonId }),
    }),
  );
}

export async function enrollInCourse(courseId: string): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (userId) {
    try {
      await setDoc(
        progressDocRef(userId, courseId),
        {
          courseId,
          lessonsCompleted: [],
          percentComplete: 0,
          enrolledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
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
  const current = prev || {
    courseId,
    lessonsCompleted: [],
    percentComplete: 0,
    updatedAt: new Date(),
  };
  const lessonsCompleted = Array.from(new Set([...current.lessonsCompleted, lessonId]));
  const percentComplete = Math.min(
    100,
    totalLessonsEstimate > 0 ? Math.round((lessonsCompleted.length / totalLessonsEstimate) * 100) : lessonsCompleted.length * 15,
  );
  return {
    ...current,
    courseId,
    lessonsCompleted,
    currentLessonId: lessonId,
    percentComplete,
    updatedAt: new Date(),
  };
}
