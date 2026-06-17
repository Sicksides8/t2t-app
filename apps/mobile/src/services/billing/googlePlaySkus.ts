/**
 * Mapeo plan canonico -> productId de Google Play.
 *
 * Estos product IDs deben existir EXACTAMENTE en Google Play Console
 * (Monetization > Products > Subscriptions). Cada uno tiene:
 *   - un base plan: cobra al precio listado (monthly o yearly).
 *   - un offer "trial-7d": 7 dias gratis para usuarios elegibles. Debe llamarse
 *     EXACTAMENTE PLAY_TRIAL_OFFER_TAG para que el provider lo levante.
 *
 * Para PRO se cobra mensual USD 9.90 / anual USD 95. Google Play traduce
 * automaticamente a moneda local segun el storefront del usuario; la app
 * NO debe mostrar el precio canonico en flujos de compra: hay que leerlo
 * de Product.priceAmount + Product.currency que devuelve fetchProducts().
 */
import type { BillingCycle, SubscriptionPlanId } from '../../types';

export const PLAY_SKUS: Record<Exclude<SubscriptionPlanId, 'free'>, Record<BillingCycle, string>> = {
  pro: {
    monthly: 't2t_pro_monthly',
    yearly: 't2t_pro_yearly',
  },
  elite: {
    monthly: 't2t_elite_monthly',
    yearly: 't2t_elite_yearly',
  },
};

/**
 * Tag del offer de trial configurado en Play Console.
 * Hay que crear un offer con este `offerId` en cada base plan elegible para trial.
 */
export const PLAY_TRIAL_OFFER_TAG = 'trial-7d';

/** Lista plana de todos los product IDs de subs (para fetchProducts inicial). */
export const ALL_PLAY_SUBSCRIPTION_IDS: string[] = Object.values(PLAY_SKUS).flatMap((perCycle) =>
  Object.values(perCycle),
);

/**
 * Resuelve el productId para (plan, cycle). Lanza si plan es 'free'.
 */
export function resolvePlayProductId(planId: SubscriptionPlanId, cycle: BillingCycle): string {
  if (planId === 'free') {
    throw new Error('PLAY_SKUS no soporta el plan free.');
  }
  return PLAY_SKUS[planId][cycle];
}

/**
 * Inversa: dado un productId que Google nos devolvio, mapearlo de vuelta a
 * (plan, cycle). El backend hace la misma operacion para validar el SKU.
 */
export function parsePlayProductId(productId: string): {
  planId: SubscriptionPlanId;
  cycle: BillingCycle;
} | null {
  for (const planId of Object.keys(PLAY_SKUS) as Array<Exclude<SubscriptionPlanId, 'free'>>) {
    for (const cycle of ['monthly', 'yearly'] as BillingCycle[]) {
      if (PLAY_SKUS[planId][cycle] === productId) {
        return { planId, cycle };
      }
    }
  }
  return null;
}
