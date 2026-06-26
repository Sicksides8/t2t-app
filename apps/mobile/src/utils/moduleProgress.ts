import type { CourseModule, Lesson } from '../types';
import type { CourseProgress } from '../types';

/** Devuelve la siguiente lección (módulo) en orden de curso, o null si es la última. */
export function getNextLesson(lessons: Lesson[], currentLessonId: string): Lesson | null {
  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((l) => l.id === currentLessonId);
  if (idx < 0 || idx >= sorted.length - 1) return null;
  return sorted[idx + 1];
}

/** Resuelve la lección activa sin caer al primer módulo por error. */
export function resolveActiveLesson(lessons: Lesson[], activeLessonId: string): Lesson | null {
  if (lessons.length === 0) return null;
  return lessons.find((l) => l.id === activeLessonId) ?? null;
}

/** @deprecated Firestore agrupa lecciones en un solo módulo; usar completado por lección. */
export function isModuleJustCompleted(
  modules: CourseModule[],
  lessons: Lesson[],
  progress: CourseProgress | undefined,
  lessonId: string,
  previouslyCompletedLessonIds: string[],
): { completed: boolean; moduleTitle?: string } {
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) return { completed: false };

  const moduleLessons = lessons.filter((l) => l.moduleId === lesson.moduleId);
  const moduleMeta = modules.find((m) => m.id === lesson.moduleId);
  if (moduleLessons.length === 0) return { completed: false };

  const completedSet = new Set([...previouslyCompletedLessonIds, lessonId]);
  const allDone = moduleLessons.every((l) => completedSet.has(l.id));
  const wasModuleDoneBefore = moduleLessons.every((l) => previouslyCompletedLessonIds.includes(l.id));

  if (allDone && !wasModuleDoneBefore) {
    return { completed: true, moduleTitle: moduleMeta?.title };
  }
  return { completed: false };
}
