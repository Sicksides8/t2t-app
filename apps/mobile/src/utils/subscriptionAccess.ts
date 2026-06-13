/**
 * Helpers de acceso por plan / estado de suscripción.
 *
 * Reglas:
 *  - FREE             -> sin acceso a cursos isPremium.
 *  - trialing/active  -> acceso completo.
 *  - cancelled        -> acceso hasta subscriptionRenewsAt (período pagado).
 *  - expired/free     -> sin acceso premium.
 *
 * Estos helpers son la única fuente de verdad para gating en la UI; no
 * inlinear chequeos sueltos.
 */
import type {
  Course,
  CourseAccessTier,
  Lesson,
  SubscriptionPlanId,
  SubscriptionStatus,
  User,
} from '../types';

export function getEffectivePlan(user?: User | null): SubscriptionPlanId {
  if (!user) return 'free';
  return user.subscriptionPlan ?? 'free';
}

export function getEffectiveStatus(user?: User | null): SubscriptionStatus {
  if (!user) return 'free';
  return user.subscriptionStatus ?? 'free';
}

export function hasPremiumAccess(user?: User | null): boolean {
  if (!user) return false;
  const plan = getEffectivePlan(user);
  const status = getEffectiveStatus(user);
  if (plan === 'free') return false;
  if (status === 'trialing' || status === 'active') return true;
  if (status === 'cancelled' && user.subscriptionRenewsAt) {
    return user.subscriptionRenewsAt.getTime() > Date.now();
  }
  return false;
}

/** Ranking interno usado para comparar planes (elite > pro > free). */
const PLAN_RANK: Record<SubscriptionPlanId, number> = { free: 0, pro: 1, elite: 2 };

/**
 * Plan mínimo necesario para acceder al curso. Combina `accessTier` (nuevo,
 * granular) con el flag legacy `isPremium`:
 *   accessTier='premium' -> 'elite'
 *   accessTier='lite'    -> 'pro'
 *   accessTier='free'    -> 'free'
 *   sin accessTier       -> isPremium ? 'pro' : 'free'
 */
export function getRequiredPlan(course: Course): SubscriptionPlanId {
  const tier: CourseAccessTier | undefined = course.accessTier;
  if (tier === 'premium') return 'elite';
  if (tier === 'lite') return 'pro';
  if (tier === 'free') return 'free';
  return course.isPremium ? 'pro' : 'free';
}

/**
 * True si el plan vigente del user (pro/elite + status habilitante) cubre el
 * `requiredPlan` solicitado. Centraliza la comparación de ranks.
 */
export function hasAccessTo(requiredPlan: SubscriptionPlanId, user?: User | null): boolean {
  if (requiredPlan === 'free') return true;
  if (!hasPremiumAccess(user)) return false;
  const userPlan = getEffectivePlan(user);
  return PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan];
}

export function canAccessCourse(course: Course, user?: User | null): boolean {
  return hasAccessTo(getRequiredPlan(course), user);
}

export function canAccessLesson(lesson: Lesson, course: Course, user?: User | null): boolean {
  if (lesson.isFree === true) return true;
  return canAccessCourse(course, user);
}

/** Días restantes de trial (0 si no aplica o ya venció). */
export function getTrialDaysRemaining(user?: User | null): number {
  if (!user?.trialEndsAt) return 0;
  const ms = user.trialEndsAt.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/** True si el user está en trial y aún quedan días. */
export function isInTrial(user?: User | null): boolean {
  return getEffectiveStatus(user) === 'trialing' && getTrialDaysRemaining(user) > 0;
}

/**
 * Mapper temporal: traduce el plan canónico (free|pro|elite) al id del seed
 * legacy de data/academy.ts (starter|academy|enterprise) para que las
 * pantallas que aún consumen `plans.find(...)` sigan funcionando.
 *
 * TODO: deuda técnica — unificar el catálogo cuando se conecte la pasarela real
 * y eliminar el mapper.
 */
export function subscriptionPlanToSeedPlan(planId?: SubscriptionPlanId): string {
  if (planId === 'pro') return 'academy';
  if (planId === 'elite') return 'enterprise';
  return 'starter';
}
