/**
 * subscriptionService
 *
 * Capa pública del dominio de suscripciones. Expone:
 *   - fetchPlans()           : catálogo legacy de planes (mantiene compat con perfil)
 *   - getCanonicalPlans()    : catálogo canónico free|pro|elite usado por billing
 *   - getBillingProvider()   : selector Strategy Pattern del proveedor de billing
 *
 * Strategy Pattern:
 *   - DEFAULT  -> mockBillingProvider en todas las plataformas. Simula trial,
 *     cobro, cancelación y renovaciones contra Firestore sin tocar pasarelas
 *     reales. Es el modo seguro para Expo Go, dev builds y demos al cliente.
 *   - OPT-IN   -> setear EXPO_PUBLIC_USE_GOOGLE_BILLING=1 activa
 *     googlePlayBillingProvider en Android (requiere EAS Build con plugin
 *     expo-iap + SKUs creados en Play Console + service account en backend).
 *   - TODO     -> appleIAPProvider (StoreKit2) y mercadoPagoProvider.
 *
 *   La firma de los providers (IBillingProvider) NO cambia, así el resto
 *   de la app (hooks flow, perfil, gating, códigos) sigue funcionando sin tocar.
 */
import { Platform } from 'react-native';
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
import { googlePlayBillingProvider } from './billing/googlePlayBillingProvider';

type PlansResponse = { success: boolean; data: Plan[] };

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
    options?: {
      couponCode?: string;
      discountPercent?: number;
      /**
       * Override de los días de cobertura. Útil cuando el código del CRM
       * define `durationDays` distintos al ciclo standard (30 monthly / 365 yearly).
       */
      durationDaysOverride?: number;
    },
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
 * Selector del provider activo (opt-in, default seguro).
 *
 *   - Default: mockBillingProvider en TODAS las plataformas. Mientras no
 *     haya credenciales reales de Play Console / Apple / MercadoPago, el
 *     mock cubre el flujo end-to-end (trial, cobro, cancel, renew) contra
 *     Firestore y deja la UI / CRM totalmente funcionales.
 *   - Opt-in Google Play: setear EXPO_PUBLIC_USE_GOOGLE_BILLING=1 y correr
 *     en Android con EAS Build. Requiere ademas:
 *       * SKUs creados en Play Console (ver googlePlaySkus.ts).
 *       * Service account + RTDN configurados en web-crm (ver .env.local.example).
 *
 * No cambiar este selector si no se cumplen TODAS las precondiciones — la
 * app se rompe en Android (fetchProducts devuelve vacío, requestPurchase
 * tira NotPrepared).
 */
export function getBillingProvider(): IBillingProvider {
  const useGoogle = process.env.EXPO_PUBLIC_USE_GOOGLE_BILLING === '1';
  if (useGoogle && Platform.OS === 'android') return googlePlayBillingProvider;
  return mockBillingProvider;
}
