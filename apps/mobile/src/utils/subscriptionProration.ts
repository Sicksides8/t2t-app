import type { BillingCycle, Subscription, SubscriptionPlanId } from '../types';
import { getCanonicalPlan } from '../services/subscriptionService';

const PLAN_RANK: Record<SubscriptionPlanId, number> = {
  free: 0,
  pro: 1,
  elite: 2,
};

const CYCLE_DAYS: Record<BillingCycle, number> = {
  monthly: 30,
  yearly: 365,
};

export type PlanChangeEstimate = {
  isUpgrade: boolean;
  creditAmount: number;
  newPlanPrice: number;
  estimatedCharge: number;
  currency: string;
  remainingDays: number;
};

function planPrice(planId: SubscriptionPlanId, cycle: BillingCycle): number {
  const plan = getCanonicalPlan(planId);
  return cycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
}

/** True si el cambio implica más valor (tier superior o mismo tier con ciclo anual). */
export function isSubscriptionUpgrade(
  fromPlan: SubscriptionPlanId,
  fromCycle: BillingCycle,
  toPlan: SubscriptionPlanId,
  toCycle: BillingCycle,
): boolean {
  const tierUp = PLAN_RANK[toPlan] > PLAN_RANK[fromPlan];
  const tierSame = PLAN_RANK[toPlan] === PLAN_RANK[fromPlan];
  const cycleUp = tierSame && fromCycle === 'monthly' && toCycle === 'yearly';
  return tierUp || cycleUp;
}

/**
 * Estima el cargo por cambio de plan (mock + preview UI).
 * Google Play calcula el monto real en el sheet nativo al usar replacementMode.
 */
export function estimatePlanChange(
  current: Subscription | null,
  newPlanId: SubscriptionPlanId,
  newCycle: BillingCycle,
  now: Date = new Date(),
): PlanChangeEstimate | null {
  if (!current || current.planId === 'free' || newPlanId === 'free') {
    return null;
  }

  const currentPrice = planPrice(current.planId, current.cycle);
  const newPlanPrice = planPrice(newPlanId, newCycle);
  const cycleDays = CYCLE_DAYS[current.cycle];
  const renewsAt = current.endDate;
  const remainingMs = Math.max(0, renewsAt.getTime() - now.getTime());
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const creditAmount =
    currentPrice > 0 && remainingDays > 0
      ? Math.round((currentPrice / cycleDays) * remainingDays * 100) / 100
      : 0;

  const isUpgrade = isSubscriptionUpgrade(current.planId, current.cycle, newPlanId, newCycle);
  const estimatedCharge = isUpgrade
    ? Math.max(0, Math.round((newPlanPrice - creditAmount) * 100) / 100)
    : 0;

  return {
    isUpgrade,
    creditAmount,
    newPlanPrice,
    estimatedCharge,
    currency: getCanonicalPlan(newPlanId).currency,
    remainingDays,
  };
}
