/**
 * Mapeo plan canónico -> productId de App Store Connect.
 *
 * TODO: crear estos product IDs en App Store Connect cuando se implemente
 * appleIAPBillingProvider (StoreKit2). Mantener la misma estructura que
 * googlePlaySkus.ts para drop-in en getBillingProvider().
 */
import type { BillingCycle, SubscriptionPlanId } from '../../types';

export const APPLE_PRODUCT_IDS: Record<
  Exclude<SubscriptionPlanId, 'free'>,
  Record<BillingCycle, string>
> = {
  pro: {
    monthly: 't2t_pro_monthly',
    yearly: 't2t_pro_yearly',
  },
  elite: {
    monthly: 't2t_black_monthly',
    yearly: 't2t_black_yearly',
  },
};

export const ALL_APPLE_SUBSCRIPTION_IDS: string[] = Object.values(APPLE_PRODUCT_IDS).flatMap(
  (perCycle) => Object.values(perCycle),
);

export function resolveAppleProductId(planId: SubscriptionPlanId, cycle: BillingCycle): string {
  if (planId === 'free') {
    throw new Error('APPLE_PRODUCT_IDS no soporta el plan free.');
  }
  return APPLE_PRODUCT_IDS[planId][cycle];
}

export function parseAppleProductId(productId: string): {
  planId: SubscriptionPlanId;
  cycle: BillingCycle;
} | null {
  for (const planId of Object.keys(APPLE_PRODUCT_IDS) as Array<
    Exclude<SubscriptionPlanId, 'free'>
  >) {
    for (const cycle of ['monthly', 'yearly'] as BillingCycle[]) {
      if (APPLE_PRODUCT_IDS[planId][cycle] === productId) {
        return { planId, cycle };
      }
    }
  }
  return null;
}
