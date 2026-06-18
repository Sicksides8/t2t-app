import type { SubscriptionPlanId } from '../types';

/** Nombres visibles de planes (IDs internos: free | pro | elite). */
export const PLAN_DISPLAY_NAME: Record<SubscriptionPlanId, string> = {
  free: 'Open',
  pro: 'Pro',
  elite: 'Black',
};

export function getPlanDisplayName(planId?: string | null): string {
  const id = (planId || 'free') as SubscriptionPlanId;
  return PLAN_DISPLAY_NAME[id] ?? id;
}
