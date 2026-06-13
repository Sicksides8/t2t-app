import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { auth, db } from './firebase';
import { apiFetch, hasApiBaseUrl } from './api';
import { tryApi } from './dataSource';
import type { Achievement, CoinTransaction } from '../types';

const LESSON_COINS = 10;
const COURSE_COINS = 200;

export interface IGamificationRepository {
  getUserCoins(userId: string): Promise<number>;
  getCoinTransactions(userId: string, max?: number): Promise<CoinTransaction[]>;
  getWeeklyChallenge(): Promise<WeeklyChallenge | null>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  awardLessonCoins(userId: string, courseId: string, lessonId: string): Promise<number>;
  awardCourseCoins(userId: string, courseId: string): Promise<number>;
  awardStreakMilestone(userId: string, milestone: number, amount: number): Promise<number>;
  /**
   * Emite el certificado / Achievement de finalización de curso de forma idempotente.
   * Si ya existe un Achievement con el mismo `{userId}_{courseId}` no se vuelve a crear.
   */
  awardCourseAchievement(userId: string, courseId: string, courseTitle: string): Promise<Achievement>;
}

export type WeeklyChallenge = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  skillId?: string;
  targetLessons?: number;
};

function uid(): string {
  const id = auth.currentUser?.uid;
  if (!id) throw new Error('No autenticado');
  return id;
}

async function firestoreCoins(userId: string): Promise<number> {
  const snap = await getDoc(doc(db, FS_COL.users, userId));
  return Number(snap.data()?.coins ?? 0);
}

/**
 * Suma coins de forma atómica e idempotente.
 *
 * - `dedupeKey` arma el id determinista `{userId}_{dedupeKey}` en
 *   `t2t_coins_transactions`. Si ese doc ya existe, no se vuelve a otorgar.
 * - Usa `runTransaction` + `increment(amount)` para evitar races entre
 *   múltiples completaciones simultáneas (dos dispositivos / doble tap).
 */
async function firestoreAddCoins(
  userId: string,
  amount: number,
  reason: string,
  dedupeKey: string,
): Promise<number> {
  const userRef = doc(db, FS_COL.users, userId);
  const txRef = doc(db, FS_COL.coinsTransactions, `${userId}_${dedupeKey}`);

  return runTransaction(db, async (tx) => {
    const txSnap = await tx.get(txRef);
    const userSnap = await tx.get(userRef);
    const current = Number(userSnap.data()?.coins ?? 0);

    if (txSnap.exists()) {
      return current;
    }

    tx.set(userRef, { coins: increment(amount), updatedAt: serverTimestamp() }, { merge: true });
    tx.set(txRef, {
      userId,
      amount,
      type: 'earned',
      reason,
      dedupeKey,
      createdAt: serverTimestamp(),
    });

    return current + amount;
  });
}

export const firestoreGamificationRepo: IGamificationRepository = {
  async getUserCoins(userId) {
    return firestoreCoins(userId);
  },

  async getCoinTransactions(userId, max = 20) {
    try {
      const q = query(
        collection(db, FS_COL.coinsTransactions),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          amount: data.amount,
          type: data.type,
          reason: data.reason,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as CoinTransaction;
      });
    } catch {
      return [];
    }
  },

  async getWeeklyChallenge() {
    try {
      const q = query(collection(db, FS_COL.weeklyChallenges), where('active', '==', true), orderBy('order', 'asc'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        description: data.description,
        xpReward: data.xpReward ?? 50,
        skillId: data.skillId,
        targetLessons: data.targetLessons ?? 3,
      };
    } catch {
      return {
        id: 'local_challenge',
        title: 'Desafío de la semana',
        description: 'Completa 3 micro-módulos para ganar bonus coins.',
        xpReward: 50,
        targetLessons: 3,
      };
    }
  },

  async getUserAchievements(userId) {
    try {
      const q = query(collection(db, FS_COL.achievements), where('userId', '==', userId), limit(20));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          type: data.type || 'course_completed',
          title: data.title,
          description: data.description,
          courseId: data.courseId,
          earnedAt: data.earnedAt?.toDate?.() || new Date(),
        } as Achievement;
      });
    } catch {
      return [];
    }
  },

  async awardLessonCoins(userId, courseId, lessonId) {
    return firestoreAddCoins(
      userId,
      LESSON_COINS,
      `Módulo completado · ${courseId}/${lessonId}`,
      `lesson_${courseId}_${lessonId}`,
    );
  },

  async awardCourseCoins(userId, courseId) {
    return firestoreAddCoins(
      userId,
      COURSE_COINS,
      `Curso completado · ${courseId}`,
      `course_${courseId}`,
    );
  },

  async awardStreakMilestone(userId, milestone, amount) {
    return firestoreAddCoins(
      userId,
      amount,
      `Racha de ${milestone} días`,
      `streak_${milestone}`,
    );
  },

  async awardCourseAchievement(userId, courseId, courseTitle) {
    // ID determinista para garantizar idempotencia (un certificado por usuario+curso).
    const achievementId = `${userId}_${courseId}`;
    const ref = doc(db, FS_COL.achievements, achievementId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        userId: data.userId,
        type: data.type || 'course_completed',
        title: data.title,
        description: data.description,
        courseId: data.courseId,
        earnedAt: data.earnedAt?.toDate?.() || new Date(),
      } as Achievement;
    }

    await setDoc(ref, {
      userId,
      type: 'course_completed',
      title: courseTitle,
      description: `Certificado por completar el curso ${courseTitle}`,
      courseId,
      earnedAt: serverTimestamp(),
    });

    return {
      id: achievementId,
      userId,
      type: 'course_completed',
      title: courseTitle,
      description: `Certificado por completar el curso ${courseTitle}`,
      courseId,
      earnedAt: new Date(),
    };
  },
};

const apiGamificationRepo: IGamificationRepository = {
  async getUserCoins(userId) {
    const api = await tryApi(() => apiFetch<{ coins: number }>(`/api/users/${userId}/coins`));
    if (api) return api.coins;
    return firestoreGamificationRepo.getUserCoins(userId);
  },

  async getCoinTransactions(userId, max) {
    const api = await tryApi(() =>
      apiFetch<{ items: CoinTransaction[] }>(`/api/users/${userId}/coins/transactions?limit=${max ?? 20}`),
    );
    if (api?.items) return api.items;
    return firestoreGamificationRepo.getCoinTransactions(userId, max);
  },

  async getWeeklyChallenge() {
    const api = await tryApi(() => apiFetch<WeeklyChallenge>('/api/challenges/current'));
    if (api) return api;
    return firestoreGamificationRepo.getWeeklyChallenge();
  },

  async getUserAchievements(userId) {
    const api = await tryApi(() => apiFetch<{ items: Achievement[] }>(`/api/users/${userId}/achievements`));
    if (api?.items) return api.items;
    return firestoreGamificationRepo.getUserAchievements(userId);
  },

  async awardLessonCoins(userId, courseId, lessonId) {
    const api = await tryApi(() =>
      apiFetch<{ coins: number }>('/api/gamification/lesson-complete', {
        method: 'POST',
        body: JSON.stringify({ courseId, lessonId }),
      }),
    );
    if (api) return api.coins;
    return firestoreGamificationRepo.awardLessonCoins(userId, courseId, lessonId);
  },

  async awardCourseCoins(userId, courseId) {
    const api = await tryApi(() =>
      apiFetch<{ coins: number }>('/api/gamification/course-complete', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      }),
    );
    if (api) return api.coins;
    return firestoreGamificationRepo.awardCourseCoins(userId, courseId);
  },

  async awardStreakMilestone(userId, milestone, amount) {
    const api = await tryApi(() =>
      apiFetch<{ coins: number }>('/api/gamification/streak-milestone', {
        method: 'POST',
        body: JSON.stringify({ milestone, amount }),
      }),
    );
    if (api) return api.coins;
    return firestoreGamificationRepo.awardStreakMilestone(userId, milestone, amount);
  },

  async awardCourseAchievement(userId, courseId, courseTitle) {
    const api = await tryApi(() =>
      apiFetch<{ achievement: Achievement }>('/api/gamification/course-achievement', {
        method: 'POST',
        body: JSON.stringify({ courseId, courseTitle }),
      }),
    );
    if (api?.achievement) return api.achievement;
    return firestoreGamificationRepo.awardCourseAchievement(userId, courseId, courseTitle);
  },
};

export function getGamificationRepo(): IGamificationRepository {
  return hasApiBaseUrl() ? apiGamificationRepo : firestoreGamificationRepo;
}

export async function awardLessonCompletion(courseId: string, lessonId: string): Promise<number> {
  const userId = uid();
  return getGamificationRepo().awardLessonCoins(userId, courseId, lessonId);
}

export async function awardCourseCompletion(courseId: string): Promise<number> {
  const userId = uid();
  return getGamificationRepo().awardCourseCoins(userId, courseId);
}

export async function awardCourseAchievement(
  courseId: string,
  courseTitle: string,
): Promise<Achievement> {
  const userId = uid();
  return getGamificationRepo().awardCourseAchievement(userId, courseId, courseTitle);
}

export async function awardStreakMilestoneCoins(milestone: number, amount: number): Promise<number> {
  const userId = uid();
  return getGamificationRepo().awardStreakMilestone(userId, milestone, amount);
}

export async function getUserCoinsBalance(): Promise<number> {
  return getGamificationRepo().getUserCoins(uid());
}

export { LESSON_COINS, COURSE_COINS };
