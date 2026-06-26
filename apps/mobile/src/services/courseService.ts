import type { Course } from '../types';
import { getCourseById as getCourseFirestore, getCourses as getCoursesFirestore } from './academyService';
import { courseMatchesSkill } from '../utils/skillCatalog';
import { apiFetch, hasApiBaseUrl } from './api';

type CoursesResponse = { success: boolean; data: Course[] };

const FIRST_TRAINING_LIMIT = 3;

function uniqueCourses(lists: Course[][]): Course[] {
  const result: Course[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const course of list) {
      if (seen.has(course.id)) continue;
      seen.add(course.id);
      result.push(course);
    }
  }
  return result;
}

async function fetchAllCourses(): Promise<Course[]> {
  if (hasApiBaseUrl()) {
    try {
      const response = await apiFetch<CoursesResponse>('/api/courses');
      if (Array.isArray(response.data)) return response.data as Course[];
    } catch {
      // fall through to Firestore
    }
  }
  return getCoursesFirestore();
}

/**
 * Cursos sugeridos para el cierre del onboarding (pre-auth).
 * Prioriza habilidades a entrenar del diagnóstico y completa con el catálogo real.
 */
export async function getFirstTrainingCourses(
  weakSkills: string[],
  topSkills: string[] = [],
): Promise<Course[]> {
  const skillQueue = [...weakSkills, ...topSkills].filter(
    (skillId, index, all) => skillId && all.indexOf(skillId) === index,
  );

  const perSkill = await Promise.all(
    (skillQueue.length ? skillQueue.slice(0, FIRST_TRAINING_LIMIT) : [undefined]).map((skillId) =>
      fetchCourses(skillId),
    ),
  );

  let picked = uniqueCourses(perSkill).slice(0, FIRST_TRAINING_LIMIT);

  if (picked.length < FIRST_TRAINING_LIMIT) {
    const catalog = await fetchCourses();
    picked = uniqueCourses([picked, catalog]).slice(0, FIRST_TRAINING_LIMIT);
  }

  return picked;
}

/**
 * Catálogo de cursos activos. Si se pasa skillId, filtra en memoria con
 * agrupación canónica (tolerante a camelCase, acentos y alias del CRM).
 */
export async function fetchCourses(skillId?: string): Promise<Course[]> {
  const all = await fetchAllCourses();
  if (!skillId) return all;
  return all.filter((c) => courseMatchesSkill(c.skillId, skillId));
}

export async function fetchCourseById(id: string): Promise<Course | null> {
  if (hasApiBaseUrl()) {
    try {
      const response = await apiFetch<{ success: boolean; data: Course }>(`/api/courses/${id}`);
      if (response.data) return response.data;
    } catch {
      // fall through
    }
  }

  const fromDb = await getCourseFirestore(id);
  return fromDb || null;
}
