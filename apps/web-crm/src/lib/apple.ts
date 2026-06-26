/**
 * Mapeo productId App Store Connect -> plan canonico.
 * Mantener alineado con apps/mobile/src/services/billing/appleProductIds.ts
 */
export type ApplePlanId = 'pro' | 'elite';
export type AppleBillingCycle = 'monthly' | 'yearly';

const APPLE_PRODUCT_IDS: Record<ApplePlanId, Record<AppleBillingCycle, string>> = {
  pro: {
    monthly: 't2t_pro_monthly',
    yearly: 't2t_pro_yearly',
  },
  elite: {
    monthly: 't2t_black_monthly',
    yearly: 't2t_black_yearly',
  },
};

export function parseAppleProductId(productId: string): {
  planId: ApplePlanId;
  cycle: AppleBillingCycle;
} | null {
  for (const planId of Object.keys(APPLE_PRODUCT_IDS) as ApplePlanId[]) {
    for (const cycle of ['monthly', 'yearly'] as AppleBillingCycle[]) {
      if (APPLE_PRODUCT_IDS[planId][cycle] === productId) {
        return { planId, cycle };
      }
    }
  }
  return null;
}

export function getApplePlanPrice(planId: ApplePlanId, cycle: AppleBillingCycle): number {
  const prices: Record<ApplePlanId, Record<AppleBillingCycle, number>> = {
    pro: { monthly: 9.9, yearly: 95.0 },
    elite: { monthly: 24.9, yearly: 239.0 },
  };
  return prices[planId][cycle];
}
