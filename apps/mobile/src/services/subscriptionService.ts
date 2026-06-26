/**
 * subscriptionService
 *
 * Capa pública del dominio de suscripciones. Expone:
 *   - fetchPlans()           : catálogo legacy de planes (mantiene compat con perfil)
 *   - getCanonicalPlans()    : catálogo canónico free|pro|elite usado por billing
 *   - getBillingProvider()   : selector Strategy Pattern del proveedor de billing
 *
 * Strategy Pattern:
 *   - EXPO_PUBLIC_BILLING_MODE=native + build nativo -> Google Play / App Store
 *   - mock (por defecto), Expo Go o web -> mockBillingProvider
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type {
  BillingCycle,
  Plan,
  Subscription,
  SubscriptionPlanId,
  SubscriptionSource,
} from '../types';
import { PLAN_DISPLAY_NAME } from '../utils/planDisplay';
import { plans as seedPlans } from '../data/academy';
import { apiFetch, hasApiBaseUrl } from './api';
import { mockBillingProvider } from './mockBillingProvider';
import { googlePlayBillingProvider } from './billing/googlePlayBillingProvider';
import { appleIAPBillingProvider } from './billing/appleIAPBillingProvider';
import { restoreApplePurchases } from './billing/appleIAPBillingProvider';
import { restorePlayPurchases } from './billing/googlePlayBillingProvider';

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
    name: PLAN_DISPLAY_NAME.free,
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    trialDays: 0,
    available: true,
  },
  {
    id: 'pro',
    name: PLAN_DISPLAY_NAME.pro,
    priceMonthly: 9.9,
    priceYearly: 95.0,
    currency: 'USD',
    trialDays: 7,
    available: true,
  },
  {
    id: 'elite',
    name: PLAN_DISPLAY_NAME.elite,
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
export interface ChangePlanOptions {
  /** Ciclo destino; si no se pasa, se mantiene el ciclo actual. */
  cycle?: BillingCycle;
}

export interface IBillingProvider {
  /** Inicia un trial gratuito (sin cobro). Setea status='trialing'. */
  startTrial(
    userId: string,
    planId: SubscriptionPlanId,
    cycle?: BillingCycle,
  ): Promise<Subscription>;
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
      /** Override del monto cobrado (mock: simula proration en changePlan). */
      chargeAmountOverride?: number;
    },
  ): Promise<Subscription>;
  /** Marca cancelada. El acceso se mantiene hasta endDate/subscriptionRenewsAt. */
  cancel(userId: string): Promise<Subscription>;
  /** Cambia el plan activo con proration cuando la pasarela lo soporta. */
  changePlan(
    userId: string,
    newPlanId: SubscriptionPlanId,
    options?: ChangePlanOptions,
  ): Promise<Subscription>;
  /** Lee la suscripción vigente del user (o null si nunca tuvo). */
  getCurrent(userId: string): Promise<Subscription | null>;
  /** Extiende el trial vigente N días (usado por cupones trial_extension). */
  extendTrial(userId: string, extraDays: number): Promise<Subscription>;
}

/** Valores aceptados de EXPO_PUBLIC_BILLING_MODE. Por defecto: mock. */
export type BillingMode = 'mock' | 'native';

function resolveBillingMode(): BillingMode {
  const raw = process.env.EXPO_PUBLIC_BILLING_MODE?.trim().toLowerCase();
  if (raw === 'native' || raw === 'production' || raw === 'store') return 'native';
  return 'mock';
}

/** Modo configurado por env (mock hasta activar tiendas en producción). */
export function getBillingMode(): BillingMode {
  return resolveBillingMode();
}

/**
 * True cuando el build puede y debe usar IAP nativo (Google Play / App Store).
 * Requiere build nativo (no Expo Go/web) y EXPO_PUBLIC_BILLING_MODE=native.
 */
export function usesNativeStoreBilling(): boolean {
  if (resolveBillingMode() !== 'native') return false;
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  // Expo Go no expone IAP nativo de forma fiable.
  if (Constants.appOwnership === 'expo') return false;
  return true;
}

/** @deprecated Usar usesNativeStoreBilling() */
export function isGoogleBillingEnabled(): boolean {
  return usesNativeStoreBilling() && Platform.OS === 'android';
}

/** @deprecated Usar usesNativeStoreBilling() */
export function isAppleBillingEnabled(): boolean {
  return usesNativeStoreBilling() && Platform.OS === 'ios';
}

/**
 * Reanuda compras de la tienda nativa tras login (Google Play o App Store).
 */
export async function restorePurchases(userId: string): Promise<void> {
  if (!usesNativeStoreBilling()) return;
  if (Platform.OS === 'android') {
    await restorePlayPurchases(userId);
  } else if (Platform.OS === 'ios') {
    await restoreApplePurchases(userId);
  }
}

/**
 * Selector del provider activo.
 *
 *   - mock (default) / Expo Go / web -> mockBillingProvider
 *   - native + Android -> googlePlayBillingProvider
 *   - native + iOS -> appleIAPBillingProvider
 */
export function getBillingProvider(): IBillingProvider {
  if (!usesNativeStoreBilling()) return mockBillingProvider;
  if (Platform.OS === 'android') return googlePlayBillingProvider;
  if (Platform.OS === 'ios') return appleIAPBillingProvider;
  return mockBillingProvider;
}
