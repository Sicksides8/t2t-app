import { skills } from '../data/academy';
import type { Course } from '../types';
import { courseMatchesSkill } from './skillCatalog';

const LEVEL_LABELS: Record<Course['level'], string> = {
  beginner: 'básico',
  intermediate: 'intermedio',
  advanced: 'avanzado',
};

export function courseSkillName(course: Course): string {
  const skill = skills.find((s) => courseMatchesSkill(s.id, course.skillId));
  return skill?.name ?? course.skillId;
}

export function formatCourseDurationMin(course: Course): string {
  const mins = Math.max(1, Math.round(course.durationMin || 1));
  return `${mins} min`;
}

/** Ej. "12 min · Liderazgo básico" */
export function formatFirstTrainingSubtitle(course: Course): string {
  const skillName = courseSkillName(course);
  const level = LEVEL_LABELS[course.level] ?? 'básico';
  return `${formatCourseDurationMin(course)} · ${skillName} ${level}`;
}
