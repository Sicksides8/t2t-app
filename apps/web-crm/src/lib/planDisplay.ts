import type { CanonicalPlanId } from './plans';

/** Nombres visibles de planes (IDs internos: free | pro | elite). */
export const PLAN_DISPLAY_NAME: Record<CanonicalPlanId, string> = {
  free: 'Open',
  pro: 'Pro',
  elite: 'Black',
};

export function getPlanDisplayName(planId?: string | null): string {
  const id = (planId || 'free') as CanonicalPlanId;
  return PLAN_DISPLAY_NAME[id] ?? planId ?? 'Open';
}
