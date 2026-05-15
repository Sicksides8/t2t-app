import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
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

async function firestoreAddCoins(userId: string, amount: number, reason: string): Promise<number> {
  const ref = doc(db, FS_COL.users, userId);
  const snap = await getDoc(ref);
  const current = Number(snap.data()?.coins ?? 0);
  const next = current + amount;
  await setDoc(ref, { coins: next, updatedAt: serverTimestamp() }, { merge: true });
  await addDoc(collection(db, FS_COL.coinsTransactions), {
    userId,
    amount,
    type: 'earned',
    reason,
    createdAt: serverTimestamp(),
  });
  return next;
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
        description: 'Completa 3 micro-lecciones para ganar bonus coins.',
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
          earnedAt: data.earnedAt?.toDate?.() || new Date(),
        } as Achievement;
      });
    } catch {
      return [];
    }
  },

  async awardLessonCoins(userId, courseId, lessonId) {
    return firestoreAddCoins(userId, LESSON_COINS, `Lección completada · ${courseId}/${lessonId}`);
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
};

export function getGamificationRepo(): IGamificationRepository {
  return hasApiBaseUrl() ? apiGamificationRepo : firestoreGamificationRepo;
}

export async function awardLessonCompletion(courseId: string, lessonId: string): Promise<number> {
  const userId = uid();
  return getGamificationRepo().awardLessonCoins(userId, courseId, lessonId);
}

export async function getUserCoinsBalance(): Promise<number> {
  return getGamificationRepo().getUserCoins(uid());
}

export { LESSON_COINS, COURSE_COINS };
