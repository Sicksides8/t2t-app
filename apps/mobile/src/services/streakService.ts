/**
 * Sistema de racha diaria anti-churn estilo Duolingo.
 *
 * - Persistencia en `t2t_users/{uid}` (campos `currentStreak`, `longestStreak`,
 *   `lastActiveDay`, `streakFreezesAvailable`, `streakFreezeWeekKey`,
 *   `streakMilestonesAwarded`).
 * - Actualización atómica vía `runTransaction` (evita races con coins/perfil).
 * - 1 escudo gratis por semana (auto-regenerado por `streakFreezeWeekKey`).
 * - Hitos premiados una sola vez en la vida del usuario (idempotente).
 *
 * Las horas se calculan en la TZ local del dispositivo. Esto puede generar
 * pequeñas inconsistencias si el usuario viaja, pero es aceptable para V1
 * sin backend que valide `serverTimestamp` por cada actividad.
 */

import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { auth, db } from './firebase';
import { awardStreakMilestoneCoins } from './gamificationService';
import { useAuthStore } from '../stores/useAuthStore';

export type StreakMilestone = 3 | 7 | 14 | 30 | 60 | 100;

export const STREAK_MILESTONES: readonly StreakMilestone[] = [3, 7, 14, 30, 60, 100] as const;

/** Tabla de bonus en coins por hito alcanzado. */
export const STREAK_MILESTONE_BONUS: Record<StreakMilestone, number> = {
  3: 20,
  7: 50,
  14: 100,
  30: 250,
  60: 500,
  100: 1000,
};

export interface StreakActivityResult {
  /** Variación de racha producida por esta actividad (0 si ya activo hoy o reset). */
  delta: number;
  /** Racha actual luego de aplicar la actividad. */
  currentStreak: number;
  /** Récord histórico (>= currentStreak). */
  longestStreak: number;
  /** Si esta actividad disparó un hito 3/7/14/30/..., el número de días; sino null. */
  milestoneReached: StreakMilestone | null;
  /** True si se consumió un escudo para evitar reset por gap. */
  freezeUsed: boolean;
  /** Escudos disponibles tras la actividad. */
  freezesAvailable: number;
  /** Día de hoy en TZ local (YYYY-MM-DD). */
  today: string;
}

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay?: string;
  freezesAvailable: number;
  /** True si ya tuvo actividad en el día local actual. */
  activeToday: boolean;
  /** Horas (aprox) que faltan hasta el cambio de día local. */
  hoursUntilBreak: number;
}

// ============================================================================
// Helpers de fecha (TZ local)
// ============================================================================

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 'YYYY-MM-DD' en hora local del dispositivo. */
export function dayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Diferencia en días enteros entre dos `YYYY-MM-DD` (b - a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay, am - 1, ad).getTime();
  const db = new Date(by, bm - 1, bd).getTime();
  return Math.round((db - da) / 86_400_000);
}

/** 'YYYY-Www' (ISO week) en TZ local. Usado para resetear el escudo semanal. */
export function weekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad2(weekNo)}`;
}

function uid(): string | null {
  return auth.currentUser?.uid ?? null;
}

function detectMilestone(days: number, awarded: number[]): StreakMilestone | null {
  if (!STREAK_MILESTONES.includes(days as StreakMilestone)) return null;
  if (awarded.includes(days)) return null;
  return days as StreakMilestone;
}

// ============================================================================
// API pública
// ============================================================================

/**
 * Registra actividad del día actual y actualiza la racha.
 *
 * Devuelve siempre un resultado, incluso si el usuario no está autenticado
 * (en ese caso `delta=0` y `currentStreak=0`). Nunca lanza.
 */
export async function recordActivity(): Promise<StreakActivityResult> {
  const userId = uid();
  const today = dayKey();

  if (!userId) {
    return {
      delta: 0,
      currentStreak: 0,
      longestStreak: 0,
      milestoneReached: null,
      freezeUsed: false,
      freezesAvailable: 0,
      today,
    };
  }

  try {
    const userRef = doc(db, FS_COL.users, userId);
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      const data = (snap.data() || {}) as {
        currentStreak?: number;
        longestStreak?: number;
        lastActiveDay?: string;
        streakFreezesAvailable?: number;
        streakFreezeWeekKey?: string;
        streakMilestonesAwarded?: number[];
      };

      const currentWeek = weekKey();
      let freezes = Number(data.streakFreezesAvailable ?? 0);
      let freezeWeek = data.streakFreezeWeekKey;
      if (freezeWeek !== currentWeek) {
        freezes = 1;
        freezeWeek = currentWeek;
      }

      let streak = Number(data.currentStreak ?? 0);
      let longest = Number(data.longestStreak ?? 0);
      const last = data.lastActiveDay;
      const awarded = Array.isArray(data.streakMilestonesAwarded)
        ? [...data.streakMilestonesAwarded]
        : [];

      let delta = 0;
      let freezeUsed = false;

      if (last === today) {
        // Ya activo hoy: no-op (pero todavía persistimos freezes regenerados).
      } else if (last && daysBetween(last, today) === 1) {
        streak += 1;
        delta = 1;
      } else if (last && daysBetween(last, today) >= 2 && freezes > 0) {
        freezes -= 1;
        freezeUsed = true;
        streak += 1;
        delta = 1;
      } else {
        streak = 1;
        delta = streak;
      }

      if (streak > longest) longest = streak;

      const milestone = detectMilestone(streak, awarded);
      if (milestone) awarded.push(milestone);

      tx.set(
        userRef,
        {
          currentStreak: streak,
          longestStreak: longest,
          lastActiveDay: today,
          streakFreezesAvailable: freezes,
          streakFreezeWeekKey: freezeWeek,
          streakMilestonesAwarded: awarded,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      return {
        delta,
        currentStreak: streak,
        longestStreak: longest,
        milestoneReached: milestone,
        freezeUsed,
        freezesAvailable: freezes,
        today,
      } satisfies StreakActivityResult;
    });

    // Espejar al store local para que la UI reaccione sin esperar a refreshUserProfile.
    const store = useAuthStore.getState();
    if (store.user && store.user.id === userId) {
      store.setUser({
        ...store.user,
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        lastActiveDay: result.today,
        streakFreezesAvailable: result.freezesAvailable,
      });
    }

    // Bonus de hito (otra transacción atómica e idempotente en coinsTransactions).
    if (result.milestoneReached) {
      const bonus = STREAK_MILESTONE_BONUS[result.milestoneReached];
      try {
        await awardStreakMilestoneCoins(result.milestoneReached, bonus);
        const refreshed = useAuthStore.getState();
        if (refreshed.user && refreshed.user.id === userId) {
          refreshed.setUser({
            ...refreshed.user,
            coins: (refreshed.user.coins ?? 0) + bonus,
          });
        }
      } catch {
        /* coins offline: el hito ya quedó marcado, se retomará en el próximo intento */
      }
    }

    return result;
  } catch {
    // Fallback: si la transacción falla (offline), no rompemos la UX.
    return {
      delta: 0,
      currentStreak: 0,
      longestStreak: 0,
      milestoneReached: null,
      freezeUsed: false,
      freezesAvailable: 0,
      today,
    };
  }
}

/** Lee el estado de racha desde el store local (sin tocar red). */
export function getStreakStatus(): StreakStatus {
  const user = useAuthStore.getState().user;
  const today = dayKey();
  const lastActiveDay = user?.lastActiveDay;
  const activeToday = lastActiveDay === today;

  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const hoursUntilBreak = Math.max(0, (endOfDay.getTime() - now.getTime()) / 3_600_000);

  return {
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    lastActiveDay,
    freezesAvailable: user?.streakFreezesAvailable ?? 0,
    activeToday,
    hoursUntilBreak,
  };
}
