import type { CourseProgress } from '../types';

/** Segundos mínimos de reproducción antes de contar progreso parcial. */
export const MIN_MEANINGFUL_WATCH_SEC = 30;

export function hasMeaningfulWatchTime(watchedSec: number, durationSec?: number): boolean {
  if (watchedSec < MIN_MEANINGFUL_WATCH_SEC) return false;
  if (durationSec && durationSec > 0 && durationSec < MIN_MEANINGFUL_WATCH_SEC * 2) {
    return watchedSec / durationSec >= 0.5;
  }
  return true;
}

type ComputeParams = {
  lessonsCompleted: string[];
  currentLessonId: string;
  totalLessons: number;
  watchedSec?: number;
  durationSec?: number;
};

export function computeCoursePercent({
  lessonsCompleted,
  currentLessonId,
  totalLessons,
  watchedSec = 0,
  durationSec = 0,
}: ComputeParams): number {
  if (totalLessons <= 0) return 0;

  const completedSet = new Set(lessonsCompleted);
  const completedCount = completedSet.size;
  if (completedSet.has(currentLessonId)) {
    return Math.min(100, Math.round((completedCount / totalLessons) * 100));
  }

  const partial =
    hasMeaningfulWatchTime(watchedSec, durationSec) && durationSec > 0 ? watchedSec / durationSec : 0;

  return Math.min(100, Math.round(((completedCount + partial) / totalLessons) * 100));
}

export function buildWatchProgressUpdate(
  prev: CourseProgress | undefined,
  courseId: string,
  lessonId: string,
  totalLessons: number,
  watchedSec: number,
  durationSec: number,
): CourseProgress | null {
  const current: CourseProgress = prev ?? {
    courseId,
    lessonsCompleted: [],
    percentComplete: 0,
    updatedAt: new Date(),
  };

  const nextPercent = computeCoursePercent({
    lessonsCompleted: current.lessonsCompleted,
    currentLessonId: lessonId,
    totalLessons,
    watchedSec,
    durationSec,
  });

  if (nextPercent <= current.percentComplete && current.currentLessonId === lessonId) {
    return null;
  }

  return {
    ...current,
    courseId,
    currentLessonId: lessonId,
    percentComplete: Math.max(current.percentComplete, nextPercent),
    updatedAt: new Date(),
  };
}

export function buildLessonCompleteProgress(
  prev: CourseProgress | undefined,
  courseId: string,
  lessonId: string,
  totalLessons: number,
): CourseProgress {
  const current: CourseProgress = prev ?? {
    courseId,
    lessonsCompleted: [],
    percentComplete: 0,
    updatedAt: new Date(),
  };
  const lessonsCompleted = Array.from(new Set([...current.lessonsCompleted, lessonId]));
  const percentComplete = computeCoursePercent({
    lessonsCompleted,
    currentLessonId: lessonId,
    totalLessons,
  });

  return {
    ...current,
    courseId,
    lessonsCompleted,
    currentLessonId: lessonId,
    percentComplete,
    updatedAt: new Date(),
  };
}
