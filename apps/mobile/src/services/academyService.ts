import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from './firebase';
import { courses as mockCourses, lessons as mockLessons, modules as mockModules, plans as mockPlans, skills as mockSkills } from '../data/academy';
import type { Course, CourseModule, DiagnosticResult, Lesson, Plan, Skill } from '../types';

export async function getSkills(): Promise<Skill[]> {
  try {
    const snapshot = await getDocs(query(collection(db, FS_COL.skills), orderBy('order', 'asc')));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Skill);
  } catch {
    return mockSkills;
  }
}

export async function getCoursesBySkill(skillId: string): Promise<Course[]> {
  return getCourses(skillId);
}

export async function getRecommendedCourses(userId: string, topSkills: string[]): Promise<Course[]> {
  const skillId = topSkills[0];
  if (skillId) {
    const bySkill = await getCourses(skillId);
    if (bySkill.length) return bySkill.slice(0, 6);
  }
  try {
    const all = await getCourses();
    return all.slice(0, 6);
  } catch {
    return skillId ? mockCourses.filter((c) => c.skillId === skillId).slice(0, 6) : mockCourses.slice(0, 6);
  }
}

export async function getCourses(skillId?: string): Promise<Course[]> {
  try {
    const base = collection(db, FS_COL.courses);
    const q = skillId
      ? query(base, where('isActive', '==', true), where('skillId', '==', skillId), orderBy('order', 'asc'))
      : query(base, where('isActive', '==', true), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Course);
  } catch {
    return skillId ? mockCourses.filter((course) => course.skillId === skillId) : mockCourses;
  }
}

export async function getCourseById(courseId: string): Promise<Course | undefined> {
  try {
    const snapshot = await getDoc(doc(db, FS_COL.courses, courseId));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Course) : undefined;
  } catch {
    return mockCourses.find((course) => course.id === courseId);
  }
}

export async function getModules(courseId: string): Promise<CourseModule[]> {
  try {
    const snapshot = await getDocs(query(collection(db, FS_COL.modules), where('courseId', '==', courseId), orderBy('order', 'asc')));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CourseModule);
  } catch {
    return mockModules.filter((module) => module.courseId === courseId);
  }
}

export async function getLessons(courseId: string): Promise<Lesson[]> {
  try {
    const snapshot = await getDocs(query(collection(db, FS_COL.lessons), where('courseId', '==', courseId), orderBy('order', 'asc')));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Lesson);
  } catch {
    return mockLessons.filter((lesson) => lesson.courseId === courseId);
  }
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const snapshot = await getDocs(query(collection(db, FS_COL.plans), where('isActive', '==', true)));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Plan);
  } catch {
    return mockPlans;
  }
}

export async function saveDiagnostic(userId: string, result: DiagnosticResult): Promise<void> {
  await setDoc(doc(db, FS_COL.diagnosticResults, userId), {
    ...result,
    userId,
    completedAt: serverTimestamp(),
  });
}

export async function redeemCode(userId: string, code: string): Promise<void> {
  await addDoc(collection(db, FS_COL.subscriptionRedemptions), {
    userId,
    code: code.trim().toUpperCase(),
    createdAt: serverTimestamp(),
  });
}
