/**
 * subscriptionService
 *
 * Capa pública del dominio de suscripciones. Expone:
 *   - fetchPlans()           : catálogo legacy de planes (mantiene compat con perfil)
 *   - getCanonicalPlans()    : catálogo canónico free|pro|elite usado por billing
 *   - redeemSubscriptionCode : compatibilidad con API HTTP histórica
 *   - getBillingProvider()   : selector Strategy Pattern del proveedor de billing
 *
 * Strategy Pattern (clave para migrar a MercadoPago / IAP):
 *   Hoy `getBillingProvider()` retorna SIEMPRE `mockBillingProvider` (Fase 1).
 *
 *   TODO MERCADOPAGO: cuando esté la pasarela real, este selector decide
 *   en runtime qué provider devolver. Sugerencia:
 *     - iOS  -> appleIAPProvider
 *     - Android -> googleIAPProvider (Play Billing)
 *     - Otros / Web -> mercadoPagoProvider
 *   La firma de los providers (IBillingProvider) NO cambia, así el resto
 *   de la app (hooks flow, perfil, gating, cupones) sigue funcionando sin tocar.
 */
import type {
  BillingCycle,
  Plan,
  Subscription,
  SubscriptionPlanId,
  SubscriptionSource,
} from '../types';
import { plans as seedPlans } from '../data/academy';
import { apiFetch, hasApiBaseUrl } from './api';
import { mockBillingProvider } from './mockBillingProvider';

type PlansResponse = { success: boolean; data: Plan[] };
type RedeemResponse = { success: boolean; data?: { subscriptionId: string } };

export interface CanonicalPlan {
  id: SubscriptionPlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  trialDays: number;
  /** Si true, el plan está disponible para suscribirse desde la app. */
  available: boolean;
}

/**
 * Catálogo canónico de planes (precios oficiales del producto).
 * Mantener alineado con HookPricingPlan seeds en data/hooksFlow.ts.
 *
 * TODO MERCADOPAGO: mover este catálogo a Firestore (t2t_plans) o al CRM
 * cuando los precios necesiten editarse sin re-deploy.
 */
const CANONICAL_PLANS: CanonicalPlan[] = [
  {
    id: 'free',
    name: 'FREE',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    trialDays: 0,
    available: true,
  },
  {
    id: 'pro',
    name: 'PRO',
    priceMonthly: 9.9,
    priceYearly: 95.0,
    currency: 'USD',
    trialDays: 7,
    available: true,
  },
  {
    id: 'elite',
    name: 'ELITE',
    priceMonthly: 24.9,
    priceYearly: 239.0,
    currency: 'USD',
    trialDays: 7,
    available: true,
  },
];

export function getCanonicalPlans(): CanonicalPlan[] {
  return CANONICAL_PLANS;
}

export function getCanonicalPlan(planId: SubscriptionPlanId): CanonicalPlan {
  const found = CANONICAL_PLANS.find((p) => p.id === planId);
  if (!found) throw new Error(`Unknown plan: ${planId}`);
  return found;
}

/** Catálogo legacy (ARS / starter|academy|enterprise) usado por la pantalla de perfil hoy. */
export async function fetchPlans(): Promise<Plan[]> {
  if (!hasApiBaseUrl()) return seedPlans;
  try {
    const response = await apiFetch<PlansResponse>('/api/plans');
    return response.data?.length ? response.data : seedPlans;
  } catch {
    return seedPlans;
  }
}

/**
 * Compatibilidad con la API HTTP histórica de redención de códigos.
 * Si EXPO_PUBLIC_API_BASE_URL no está configurada devuelve null y el
 * caller debe usar couponService.applyCouponToUser() como fuente de verdad.
 */
export async function redeemSubscriptionCode(code: string): Promise<string | null> {
  if (!hasApiBaseUrl()) return null;
  try {
    const response = await apiFetch<RedeemResponse>('/api/subscriptions/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return response.data?.subscriptionId || null;
  } catch {
    return null;
  }
}

/**
 * Provider de billing.
 *
 * Cualquier flujo de la app que necesite iniciar trial, cobrar, cancelar
 * o cambiar plan debe consumir esta interfaz — NUNCA llamar directo a
 * mockBillingProvider para que la sustitución por MercadoPago/IAP sea
 * drop-in (sólo cambiar el return de getBillingProvider()).
 */
export interface IBillingProvider {
  /** Inicia un trial gratuito (sin cobro). Setea status='trialing'. */
  startTrial(userId: string, planId: SubscriptionPlanId): Promise<Subscription>;
  /** Cobra y activa la suscripción. status='active'. Crea Payment. */
  subscribe(
    userId: string,
    planId: SubscriptionPlanId,
    cycle: BillingCycle,
    source: SubscriptionSource,
    options?: { couponCode?: string; discountPercent?: number },
  ): Promise<Subscription>;
  /** Marca cancelada. El acceso se mantiene hasta endDate/subscriptionRenewsAt. */
  cancel(userId: string): Promise<Subscription>;
  /** Cambia el plan activo. Cancela el actual y arranca uno nuevo (mock siempre acepta). */
  changePlan(userId: string, newPlanId: SubscriptionPlanId): Promise<Subscription>;
  /** Lee la suscripción vigente del user (o null si nunca tuvo). */
  getCurrent(userId: string): Promise<Subscription | null>;
  /** Extiende el trial vigente N días (usado por cupones trial_extension). */
  extendTrial(userId: string, extraDays: number): Promise<Subscription>;
}

/**
 * TODO MERCADOPAGO: reemplazar este return por la lógica real cuando se
 * conecte la pasarela. Hoy retorna siempre el mock en cualquier plataforma.
 *
 * Ejemplo futuro:
 *   import { Platform } from 'react-native';
 *   if (Platform.OS === 'ios')     return appleIAPProvider;
 *   if (Platform.OS === 'android') return googleIAPProvider;
 *   return mercadoPagoProvider;
 */
export function getBillingProvider(): IBillingProvider {
  return mockBillingProvider;
}
