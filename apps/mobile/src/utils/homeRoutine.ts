import type { Course, CourseProgress, Lesson } from '../types';

export function pickHeroCourse(
  courses: Course[],
  progressMap: Record<string, CourseProgress>,
): Course | null {
  if (!courses.length) return null;

  const inProgress = courses
    .map((course) => ({ course, pct: progressMap[course.id]?.percentComplete ?? 0 }))
    .filter((x) => x.pct > 0 && x.pct < 100)
    .sort((a, b) => b.pct - a.pct);

  if (inProgress.length) return inProgress[0].course;
  return courses[0] ?? null;
}

export function pickNextLesson(
  courseId: string,
  progress: CourseProgress | undefined,
  lessons: Lesson[],
): Lesson | null {
  const courseLessons = lessons
    .filter((l) => l.courseId === courseId)
    .sort((a, b) => a.order - b.order);
  if (!courseLessons.length) return null;

  const completed = new Set(progress?.lessonsCompleted ?? []);
  return courseLessons.find((l) => !completed.has(l.id)) ?? courseLessons[0];
}

export function formatHeroMeta(skillName: string, durationMin: number): string {
  return `${skillName} · ${durationMin} min · Hacer hoy`;
}
