import type { Course } from '../types';
import { courses as seedCourses } from '../data/academy';
import { getCourseById as getCourseFirestore, getCourses as getCoursesFirestore } from './academyService';
import { apiFetch, hasApiBaseUrl } from './api';

type CoursesResponse = { success: boolean; data: Course[] };

export async function fetchCourses(skillId?: string): Promise<Course[]> {
  if (hasApiBaseUrl()) {
    try {
      const query = skillId ? `?skillId=${encodeURIComponent(skillId)}` : '';
      const response = await apiFetch<CoursesResponse>(`/api/courses${query}`);
      if (response.data?.length) return response.data as Course[];
    } catch {
      // fall through to Firestore
    }
  }

  const fromDb = await getCoursesFirestore(skillId);
  return fromDb.length ? fromDb : skillId ? seedCourses.filter((c) => c.skillId === skillId) : seedCourses;
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
  return fromDb || seedCourses.find((c) => c.id === id) || null;
}
