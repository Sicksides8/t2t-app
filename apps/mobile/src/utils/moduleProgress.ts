import type { CourseModule, Lesson } from '../types';
import type { CourseProgress } from '../types';

/** True si al completar `lessonId` se terminó el módulo (todas las lecciones del módulo). */
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
