import type { SubscriptionPlanId } from '../types';

/** Nombres visibles de planes (IDs internos: free | pro | elite). */
export const PLAN_DISPLAY_NAME: Record<SubscriptionPlanId, string> = {
  free: 'Open',
  pro: 'Pro',
  elite: 'Black',
};

const LEGACY_PLAN_LABELS: Record<string, string> = {
  starter: 'Open',
  academy: 'Pro',
  enterprise: 'Black',
  open: 'Open',
  black: 'Black',
  ELITE: 'Black',
  Elite: 'Black',
};

export function getPlanDisplayName(planId?: string | null): string {
  const id = planId || 'free';
  if (id in PLAN_DISPLAY_NAME) return PLAN_DISPLAY_NAME[id as SubscriptionPlanId];
  if (id in LEGACY_PLAN_LABELS) return LEGACY_PLAN_LABELS[id];
  const lower = id.toLowerCase();
  if (lower === 'elite') return PLAN_DISPLAY_NAME.elite;
  if (lower === 'enterprise') return PLAN_DISPLAY_NAME.elite;
  if (lower === 'starter') return PLAN_DISPLAY_NAME.free;
  if (lower === 'academy') return PLAN_DISPLAY_NAME.pro;
  return id;
}
