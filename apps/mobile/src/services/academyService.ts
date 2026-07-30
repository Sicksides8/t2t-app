import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from './firebase';
import { plans as staticPlans, skills as staticSkills } from '../data/academy';
import { courseMatchesSkill } from '../utils/skillCatalog';
import { apiFetch, hasApiBaseUrl } from './api';
import type { Course, CourseModule, DiagnosticResult, Lesson, Plan, Skill } from '../types';

export async function getSkills(): Promise<Skill[]> {
  try {
    const snapshot = await getDocs(query(collection(db, FS_COL.skills), orderBy('order', 'asc')));
    const remote = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Skill);
    return remote.length ? remote : staticSkills;
  } catch {
    return staticSkills;
  }
}

export async function getCoursesBySkill(skillId: string): Promise<Course[]> {
  return getCourses(skillId);
}

export async function getRecommendedCourses(userId: string, topSkills: string[]): Promise<Course[]> {
  void userId;

  const all = await getCourses();

  if (!topSkills.length) {
    return shuffle(all).slice(0, 8);
  }

  const perSkill = topSkills.slice(0, 3).map((skillId) =>
    all.filter((c) => courseMatchesSkill(c.skillId, skillId)),
  );

  const interleaved: Course[] = [];
  const seen = new Set<string>();
  const maxLen = Math.max(...perSkill.map((list) => list.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const list of perSkill) {
      const course = list[i];
      if (course && !seen.has(course.id)) {
        seen.add(course.id);
        interleaved.push(course);
      }
    }
  }

  return interleaved.slice(0, 8);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Orden plan Beta: planOrder primero, fallback a order de catálogo. */
export function sortCoursesForPlanBeta(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => {
    const ao =
      typeof a.planOrder === 'number' ? a.planOrder : typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bo =
      typeof b.planOrder === 'number' ? b.planOrder : typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    return ao - bo;
  });
}

/** Cursos con planOrder definido en CRM, ordenados para el plan Beta. */
export function getPlanOrderedCourses(courses: Course[]): Course[] {
  return sortCoursesForPlanBeta(courses.filter((c) => typeof c.planOrder === 'number'));
}

export async function getCourses(skillId?: string): Promise<Course[]> {
  try {
    const base = collection(db, FS_COL.courses);
    const q = query(base, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Course);
    const sorted = items.sort((a, b) => {
      const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      return ao - bo;
    });
    if (!skillId) return sorted;
    return sorted.filter((c) => courseMatchesSkill(c.skillId, skillId));
  } catch {
    return [];
  }
}

export async function getCourseById(courseId: string): Promise<Course | undefined> {
  try {
    const snapshot = await getDoc(doc(db, FS_COL.courses, courseId));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Course) : undefined;
  } catch {
    return undefined;
  }
}

export async function getModules(courseId: string): Promise<CourseModule[]> {
  try {
    const snapshot = await getDocs(query(collection(db, FS_COL.modules), where('courseId', '==', courseId)));
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CourseModule);
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return [];
  }
}

export async function getLessons(courseId: string): Promise<Lesson[]> {
  if (hasApiBaseUrl()) {
    try {
      const response = await apiFetch<{ success: boolean; data: Lesson[] }>(
        `/api/courses/${courseId}/lessons`,
      );
      if (Array.isArray(response.data) && response.data.length > 0) {
        return [...response.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    } catch {
      /* fallback Firestore */
    }
  }

  try {
    const snapshot = await getDocs(query(collection(db, FS_COL.lessons), where('courseId', '==', courseId)));
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Lesson);
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return [];
  }
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const snapshot = await getDocs(query(collection(db, FS_COL.plans), where('isActive', '==', true)));
    const remote = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Plan);
    return remote.length ? remote : staticPlans;
  } catch {
    return staticPlans;
  }
}

export async function saveDiagnostic(userId: string, result: DiagnosticResult): Promise<void> {
  await setDoc(doc(db, FS_COL.diagnosticResults, userId), {
    ...result,
    userId,
    completedAt: serverTimestamp(),
  });
}
