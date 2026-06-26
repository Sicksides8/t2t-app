/**
 * googlePlayBillingProvider — Google Play Billing v6 via expo-iap.
 *
 * Implementa IBillingProvider (Strategy Pattern de subscriptionService) usando
 * Google Play Billing. El flujo es event-based:
 *
 *   1. ensureConnection() abre el cliente y engancha listeners (idempotente).
 *   2. fetchProducts() trae el SKU y sus offers (base plan + trial-7d).
 *   3. requestPurchase() lanza el sheet nativo; resuelve por listener.
 *   4. purchaseUpdatedListener -> POST /api/billing/google/verify (web-crm
 *      valida con Google Play Developer API y escribe Firestore).
 *   5. finishTransaction() acknowledges el purchaseToken (sin esto, Play
 *      reembolsa automáticamente a las 72h).
 *   6. Devolvemos el Subscription leído del Firestore que escribió el backend.
 *
 * Cancel y extendTrial: Google Play obliga a manejarlos via Play Store /
 * Developer API server-side respectivamente, no se hacen client-side.
 *
 * El estado real de la sub (renovaciones, grace period, cancelaciones)
 * lo escribe el RTDN handler en /api/billing/google/rtdn.
 */
import { Linking, Platform } from 'react-native';
import {
  ErrorCode,
  deepLinkToSubscriptions,
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type ExpoPurchaseError,
  type Purchase,
} from 'expo-iap';

import { apiFetch, hasApiBaseUrl } from '../api';
import { mockBillingProvider } from '../mockBillingProvider';
import type { IBillingProvider, ChangePlanOptions } from '../subscriptionService';
import type {
  BillingCycle,
  Subscription,
  SubscriptionPlanId,
} from '../../types';
import { isSubscriptionUpgrade } from '../../utils/subscriptionProration';
import {
  ALL_PLAY_SUBSCRIPTION_IDS,
  PLAY_TRIAL_OFFER_TAG,
  parsePlayProductId,
  resolvePlayProductId,
} from './googlePlaySkus';
import {
  completePending,
  failPending,
  getPendingPurchase,
  registerPending,
  runBillingExclusive,
  verifyPurchaseOnce,
} from './billingPurchaseGate';

// Package name de la app. Debe coincidir con android.package en app.json.
const PACKAGE_NAME = 'com.t2tacademy.mobile';

// ============================================================================
// Connection lifecycle (idempotente)
// ============================================================================

let connectionReady = false;
let connectionPromise: Promise<void> | null = null;
let purchaseSub: { remove: () => void } | null = null;
let errorSub: { remove: () => void } | null = null;

async function ensureConnection(): Promise<void> {
  if (connectionReady) return;
  if (connectionPromise) return connectionPromise;
  connectionPromise = (async () => {
    await initConnection();
    if (!purchaseSub) purchaseSub = purchaseUpdatedListener(handlePurchaseUpdate);
    if (!errorSub) errorSub = purchaseErrorListener(handlePurchaseError);
    connectionReady = true;
  })();
  try {
    await connectionPromise;
  } finally {
    connectionPromise = null;
  }
}

export async function shutdownGoogleBilling(): Promise<void> {
  try {
    purchaseSub?.remove();
    errorSub?.remove();
    purchaseSub = null;
    errorSub = null;
    if (connectionReady) {
      await endConnection();
      connectionReady = false;
    }
  } catch (err) {
    console.warn('[googlePlay] shutdown error:', err);
  }
}

// ============================================================================
// Verificación en el backend
// ============================================================================

type VerifyResponse = {
  success: boolean;
  data?: { subscription: Subscription };
  error?: { message: string };
};

async function verifyOnBackend(
  userId: string,
  productId: string,
  purchaseToken: string,
  source: 'google',
  options?: { couponCode?: string },
): Promise<Subscription> {
  if (!hasApiBaseUrl()) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL no configurada — no se puede validar la compra.');
  }
  const res = await apiFetch<VerifyResponse>('/api/billing/google/verify', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      productId,
      purchaseToken,
      packageName: PACKAGE_NAME,
      source,
      couponCode: options?.couponCode,
    }),
  });
  if (!res.success || !res.data?.subscription) {
    throw new Error(res.error?.message || 'No se pudo validar la compra en el servidor.');
  }
  const sub = res.data.subscription;
  return {
    ...sub,
    startDate: new Date(sub.startDate as unknown as string),
    endDate: new Date(sub.endDate as unknown as string),
    trialStartedAt: sub.trialStartedAt
      ? new Date(sub.trialStartedAt as unknown as string)
      : undefined,
    trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt as unknown as string) : undefined,
    cancelledAt: sub.cancelledAt ? new Date(sub.cancelledAt as unknown as string) : undefined,
  };
}

// ============================================================================
// Listeners
// ============================================================================

async function handlePurchaseUpdate(purchase: Purchase): Promise<void> {
  const token = (purchase as Purchase & { purchaseToken?: string }).purchaseToken;
  const active = getPendingPurchase();

  try {
    if (!active) {
      if (token && purchase.productId && parsePlayProductId(purchase.productId)) {
        try {
          await finishTransaction({ purchase, isConsumable: false });
        } catch {
          /* ignore */
        }
      }
      return;
    }

    if (active.platform !== 'google') return;
    if (active.productId && purchase.productId !== active.productId) return;

    if (!token) {
      failPending(new Error('La compra no incluyó purchaseToken.'));
      return;
    }

    const sub = await verifyPurchaseOnce(`google:${token}`, () =>
      verifyOnBackend(active.userId, purchase.productId, token, 'google', {
        couponCode: active.couponCode,
      }),
    );

    await finishTransaction({ purchase, isConsumable: false });
    completePending(sub);
  } catch (err) {
    console.error('[googlePlay] handlePurchaseUpdate error:', err);
    if (getPendingPurchase()) {
      failPending(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

function handlePurchaseError(error: ExpoPurchaseError): void {
  if (!getPendingPurchase()) return;
  if (error.code === ErrorCode.UserCancelled) {
    failPending(Object.assign(new Error('Compra cancelada por el usuario.'), { code: 'cancelled' }));
    return;
  }
  console.error('[googlePlay] purchaseError:', error);
  failPending(new Error(error.message || `Error de Google Play (${error.code || 'unknown'}).`));
}

// ============================================================================
// Helpers de SKU/offer
// ============================================================================

type SubscriptionOfferLike = {
  offerTokenAndroid?: string;
  offerTagsAndroid?: string[];
};

type ProductSubscriptionLike = {
  id: string;
  subscriptionOffers?: SubscriptionOfferLike[];
};

async function fetchPlaySubscription(productId: string): Promise<ProductSubscriptionLike> {
  const products = (await fetchProducts({
    skus: [productId],
    type: 'subs',
  })) as unknown as ProductSubscriptionLike[];
  const match = products.find((p) => p.id === productId);
  if (!match) {
    throw new Error(`SKU ${productId} no está dado de alta en Google Play Console.`);
  }
  return match;
}

function pickOfferToken(sub: ProductSubscriptionLike, wantTrial: boolean): string {
  const offers = sub.subscriptionOffers || [];
  if (offers.length === 0) {
    throw new Error(`El SKU ${sub.id} no tiene offers configurados en Play Console.`);
  }
  if (wantTrial) {
    const trial = offers.find((o) => o.offerTagsAndroid?.includes(PLAY_TRIAL_OFFER_TAG));
    if (!trial?.offerTokenAndroid) {
      throw new Error(
        `El SKU ${sub.id} no tiene un offer con tag "${PLAY_TRIAL_OFFER_TAG}" — creá uno en Play Console.`,
      );
    }
    return trial.offerTokenAndroid;
  }
  // Base plan: el primer offer SIN el tag de trial.
  const base = offers.find((o) => !o.offerTagsAndroid?.includes(PLAY_TRIAL_OFFER_TAG)) || offers[0];
  if (!base.offerTokenAndroid) {
    throw new Error(`El SKU ${sub.id} no tiene base plan con offerToken.`);
  }
  return base.offerTokenAndroid;
}

// Google Play Billing replacement modes (BillingFlowParams.SubscriptionUpdateParams)
const REPLACEMENT_WITH_TIME_PRORATION = 1;
const REPLACEMENT_WITHOUT_PRORATION = 3;

async function resolveActivePurchaseToken(
  current: Subscription | null,
  productId?: string,
): Promise<string | undefined> {
  if (current?.purchaseToken) return current.purchaseToken;
  await ensureConnection();
  const purchases = (await getAvailablePurchases()) as unknown as Purchase[] | undefined;
  if (!purchases?.length) return undefined;
  if (productId) {
    const match = purchases.find((p) => p.productId === productId);
    const token = (match as Purchase & { purchaseToken?: string })?.purchaseToken;
    if (token) return token;
  }
  for (const p of purchases) {
    if (!parsePlayProductId(p.productId)) continue;
    const token = (p as Purchase & { purchaseToken?: string }).purchaseToken;
    if (token) return token;
  }
  return undefined;
}

const PURCHASE_TIMEOUT_MS = 5 * 60 * 1000;

async function launchPurchase(params: {
  userId: string;
  productId: string;
  offerToken: string;
  obfuscatedAccountId: string;
  couponCode?: string;
  purchaseTokenAndroid?: string;
  replacementModeAndroid?: number;
}): Promise<Subscription> {
  return runBillingExclusive(async () => {
    await ensureConnection();

    const googleRequest: Record<string, unknown> = {
      skus: [params.productId],
      obfuscatedAccountId: params.obfuscatedAccountId,
      subscriptionOffers: [{ sku: params.productId, offerToken: params.offerToken }],
    };
    if (params.purchaseTokenAndroid) {
      googleRequest.purchaseTokenAndroid = params.purchaseTokenAndroid;
    }
    if (params.replacementModeAndroid !== undefined) {
      googleRequest.replacementModeAndroid = params.replacementModeAndroid;
    }

    const purchasePromise = registerPending(
      {
        userId: params.userId,
        productId: params.productId,
        platform: 'google',
        couponCode: params.couponCode,
      },
      PURCHASE_TIMEOUT_MS,
    );

    try {
      await requestPurchase({
        request: {
          google: googleRequest as {
            skus: string[];
            obfuscatedAccountId: string;
            subscriptionOffers: { sku: string; offerToken: string }[];
            purchaseTokenAndroid?: string;
            replacementModeAndroid?: number;
          },
        },
        type: 'subs',
      });
    } catch (err) {
      failPending(err instanceof Error ? err : new Error(String(err)));
    }

    return purchasePromise;
  });
}

// ============================================================================
// IBillingProvider implementation
// ============================================================================

export const googlePlayBillingProvider: IBillingProvider = {
  async startTrial(userId, planId, cycle = 'monthly') {
    if (planId === 'free') {
      throw new Error('No se puede iniciar trial sobre el plan FREE.');
    }
    const productId = resolvePlayProductId(planId, cycle);
    await ensureConnection();
    const sub = await fetchPlaySubscription(productId);
    const offerToken = pickOfferToken(sub, true);
    return launchPurchase({
      userId,
      productId,
      offerToken,
      obfuscatedAccountId: userId,
    });
  },

  async subscribe(userId, planId, cycle, source, options) {
    if (planId === 'free') {
      throw new Error('No se puede suscribir al plan FREE — usá cancel() en su lugar.');
    }
    // El Strategy Pattern admite forzar otro source (ej: 'code' / 'mock').
    // Pero si pasaron 'google' o nada nosotros somos el provider de Play.
    if (source && source !== 'google' && source !== 'mock') {
      // Permitimos fall-through al mock para sources no Play (ej: cupones
      // 'code' que dan unlocks gratis sin tocar la pasarela).
      return mockBillingProvider.subscribe(userId, planId, cycle, source, options);
    }

    const productId = resolvePlayProductId(planId, cycle);
    await ensureConnection();
    const sub = await fetchPlaySubscription(productId);
    const offerToken = pickOfferToken(sub, false);
    return launchPurchase({
      userId,
      productId,
      offerToken,
      obfuscatedAccountId: userId,
      couponCode: options?.couponCode,
    });
  },

  async cancel(userId) {
    // Google Play no permite cancelar via API desde la app — el usuario
    // tiene que ir a la pantalla de subs de Play Store. Hacemos deep-link
    // y devolvemos el Subscription actual sin tocarlo. El RTDN actualizará
    // el estado cuando llegue SUBSCRIPTION_CANCELED.
    const current = await this.getCurrent(userId);
    const skuAndroid = current?.planId && current.planId !== 'free' && current.cycle
      ? resolvePlayProductId(current.planId, current.cycle)
      : undefined;

    try {
      await ensureConnection();
      if (skuAndroid) {
        await deepLinkToSubscriptions({
          skuAndroid,
          packageNameAndroid: PACKAGE_NAME,
        });
      } else {
        await Linking.openURL(
          `https://play.google.com/store/account/subscriptions?package=${PACKAGE_NAME}`,
        );
      }
    } catch (err) {
      console.warn('[googlePlay] deepLinkToSubscriptions failed:', err);
      await Linking.openURL(
        `https://play.google.com/store/account/subscriptions?package=${PACKAGE_NAME}`,
      );
    }

    if (!current) {
      throw new Error('No hay suscripción para cancelar.');
    }
    return current;
  },

  async changePlan(userId, newPlanId, options?: ChangePlanOptions) {
    const current = await this.getCurrent(userId);
    const cycle: BillingCycle =
      options?.cycle ?? (current?.cycle === 'yearly' ? 'yearly' : 'monthly');
    if (newPlanId === 'free') {
      return this.cancel(userId);
    }

    const productId = resolvePlayProductId(newPlanId, cycle);
    await ensureConnection();
    const playSub = await fetchPlaySubscription(productId);
    const offerToken = pickOfferToken(playSub, false);

    const hasActiveGoogleSub =
      current &&
      current.source === 'google' &&
      current.planId !== 'free' &&
      (current.status === 'active' || current.status === 'trialing');

    if (hasActiveGoogleSub && current) {
      const currentProductId = resolvePlayProductId(current.planId, current.cycle);
      const purchaseToken = await resolveActivePurchaseToken(current, currentProductId);
      const isUpgrade = isSubscriptionUpgrade(
        current.planId,
        current.cycle,
        newPlanId,
        cycle,
      );
      const replacementModeAndroid = isUpgrade
        ? REPLACEMENT_WITH_TIME_PRORATION
        : REPLACEMENT_WITHOUT_PRORATION;

      if (purchaseToken && currentProductId !== productId) {
        try {
          return await launchPurchase({
            userId,
            productId,
            offerToken,
            obfuscatedAccountId: userId,
            purchaseTokenAndroid: purchaseToken,
            replacementModeAndroid,
          });
        } catch (err) {
          if (err instanceof Error && /already.*owned/i.test(err.message)) {
            await deepLinkToSubscriptions({
              skuAndroid: productId,
              packageNameAndroid: PACKAGE_NAME,
            });
            throw new Error('Cambiá tu plan desde Google Play y volvé acá para confirmarlo.');
          }
          throw err;
        }
      }
    }

    try {
      return await this.subscribe(userId, newPlanId, cycle, 'google');
    } catch (err) {
      if (err instanceof Error && /already.*owned/i.test(err.message)) {
        await deepLinkToSubscriptions({
          skuAndroid: productId,
          packageNameAndroid: PACKAGE_NAME,
        });
        throw new Error('Cambiá tu plan desde Google Play y volvé acá para confirmarlo.');
      }
      throw err;
    }
  },

  async getCurrent(userId) {
    // El doc lo escribe el backend (verify + RTDN); la fuente de verdad
    // sigue siendo Firestore — usamos el mismo lector que el mock.
    return mockBillingProvider.getCurrent(userId);
  },

  async extendTrial(_userId, _extraDays) {
    // En Google Play extender un trial requiere purchases.subscriptions.defer
    // (server-side, con la Developer API). No se puede hacer client-side.
    // TODO: cuando se necesite, agregar POST /api/billing/google/defer-trial.
    throw new Error('extendTrial no está soportado por Google Play en este momento.');
  },
};

// ============================================================================
// Restore on app boot (idempotente)
// ============================================================================

/**
 * Reanuda compras pendientes que el listener no atrapó (ej: el usuario cerró
 * la app durante la verificación). Para llamar desde useAuthStore tras login.
 */
export async function restorePlayPurchases(userId: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  await runBillingExclusive(async () => {
    if (getPendingPurchase()) return;
    try {
      await ensureConnection();
      const purchases = (await getAvailablePurchases()) as unknown as Purchase[] | undefined;
      if (!purchases?.length) return;
      for (const p of purchases) {
        const token = (p as Purchase & { purchaseToken?: string }).purchaseToken;
        if (!token) continue;
        if (!parsePlayProductId(p.productId)) continue;
        try {
          await verifyPurchaseOnce(`google:${token}`, () =>
            verifyOnBackend(userId, p.productId, token, 'google'),
          );
          await finishTransaction({ purchase: p, isConsumable: false });
        } catch (err) {
          console.warn('[googlePlay] restore failed for', p.productId, err);
        }
      }
    } catch (err) {
      console.warn('[googlePlay] restorePlayPurchases error:', err);
    }
  });
}

/** Lista de SKUs precargada para pre-fetch en pantallas de pricing. */
export { ALL_PLAY_SUBSCRIPTION_IDS };
