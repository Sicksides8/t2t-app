/**
 * appleIAPBillingProvider — App Store subscriptions via expo-iap (StoreKit).
 *
 * Mismo flujo que Google Play: initConnection → requestPurchase → verify backend
 * → finishTransaction. Activo automáticamente en iOS (build nativo, no Expo Go).
 */
import { Linking, Platform } from 'react-native';
import {
  ErrorCode,
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
import type { BillingCycle, Subscription } from '../../types';
import { isSubscriptionUpgrade } from '../../utils/subscriptionProration';
import {
  parseAppleProductId,
  resolveAppleProductId,
} from './appleProductIds';
import {
  completePending,
  failPending,
  getPendingPurchase,
  registerPending,
  runBillingExclusive,
  verifyPurchaseOnce,
} from './billingPurchaseGate';

const PURCHASE_TIMEOUT_MS = 5 * 60 * 1000;
const IOS_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

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

type VerifyResponse = {
  success: boolean;
  data?: { subscription: Subscription };
  error?: { message: string };
};

function purchaseDedupeKey(purchase: Purchase): string | null {
  const token = (purchase as Purchase & { purchaseToken?: string }).purchaseToken;
  const txId = (purchase as Purchase & { transactionId?: string }).transactionId;
  if (token) return `apple:${token}`;
  if (txId) return `apple:tx:${txId}`;
  return null;
}

async function verifyOnBackend(
  userId: string,
  productId: string,
  purchase: Purchase,
  options?: { couponCode?: string },
): Promise<Subscription> {
  if (!hasApiBaseUrl()) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL no configurada — no se puede validar la compra.');
  }
  const token = (purchase as Purchase & { purchaseToken?: string }).purchaseToken;
  const transactionId = (purchase as Purchase & { transactionId?: string }).transactionId;
  const originalTransactionId = (purchase as Purchase & { originalTransactionIdentifierIOS?: string })
    .originalTransactionIdentifierIOS;

  const res = await apiFetch<VerifyResponse>('/api/billing/apple/verify', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      productId,
      purchaseToken: token,
      transactionId,
      originalTransactionId,
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

async function handlePurchaseUpdate(purchase: Purchase): Promise<void> {
  const active = getPendingPurchase();
  const dedupeKey = purchaseDedupeKey(purchase);

  try {
    if (!active) {
      if (dedupeKey && parseAppleProductId(purchase.productId)) {
        try {
          await finishTransaction({ purchase, isConsumable: false });
        } catch {
          /* ignore */
        }
      }
      return;
    }

    if (active.platform !== 'apple') return;
    if (active.productId && purchase.productId !== active.productId) return;
    if (!dedupeKey) {
      failPending(new Error('La compra de Apple no incluyó transactionId.'));
      return;
    }

    const sub = await verifyPurchaseOnce(dedupeKey, () =>
      verifyOnBackend(active.userId, purchase.productId, purchase, {
        couponCode: active.couponCode,
      }),
    );

    await finishTransaction({ purchase, isConsumable: false });
    completePending(sub);
  } catch (err) {
    console.error('[appleIAP] handlePurchaseUpdate error:', err);
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
  console.error('[appleIAP] purchaseError:', error);
  failPending(new Error(error.message || `Error de App Store (${error.code || 'unknown'}).`));
}

async function launchPurchase(params: {
  userId: string;
  productId: string;
  couponCode?: string;
}): Promise<Subscription> {
  return runBillingExclusive(async () => {
    await ensureConnection();

    const purchasePromise = registerPending(
      {
        userId: params.userId,
        productId: params.productId,
        platform: 'apple',
        couponCode: params.couponCode,
      },
      PURCHASE_TIMEOUT_MS,
    );

    try {
      await requestPurchase({
        request: {
          apple: { sku: params.productId },
        },
        type: 'subs',
      });
    } catch (err) {
      failPending(err instanceof Error ? err : new Error(String(err)));
    }

    return purchasePromise;
  });
}

export const appleIAPBillingProvider: IBillingProvider = {
  async startTrial(userId, planId, cycle = 'monthly') {
    if (planId === 'free') {
      throw new Error('No se puede iniciar trial sobre el plan FREE.');
    }
    const productId = resolveAppleProductId(planId, cycle);
    await ensureConnection();
    await fetchProducts({ skus: [productId], type: 'subs' });
    return launchPurchase({ userId, productId });
  },

  async subscribe(userId, planId, cycle, source, options) {
    if (planId === 'free') {
      throw new Error('No se puede suscribir al plan FREE — usá cancel() en su lugar.');
    }
    if (source === 'code' || source === 'mock') {
      return mockBillingProvider.subscribe(userId, planId, cycle, source, options);
    }

    const productId = resolveAppleProductId(planId, cycle);
    await ensureConnection();
    await fetchProducts({ skus: [productId], type: 'subs' });
    return launchPurchase({ userId, productId, couponCode: options?.couponCode });
  },

  async cancel(userId) {
    const current = await this.getCurrent(userId);
    try {
      await Linking.openURL(IOS_SUBSCRIPTIONS_URL);
    } catch (err) {
      console.warn('[appleIAP] open subscriptions failed:', err);
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

    // App Store gestiona upgrade/downgrade en el sheet nativo al comprar el nuevo SKU.
    const productId = resolveAppleProductId(newPlanId, cycle);
    await ensureConnection();
    await fetchProducts({ skus: [productId], type: 'subs' });

    if (current && current.planId !== 'free') {
      const isUpgrade = isSubscriptionUpgrade(current.planId, current.cycle, newPlanId, cycle);
      if (!isUpgrade) {
        await Linking.openURL(IOS_SUBSCRIPTIONS_URL);
        throw new Error('Para bajar de plan, gestioná la suscripción en Ajustes de Apple.');
      }
    }

    return launchPurchase({ userId, productId });
  },

  async getCurrent(userId) {
    return mockBillingProvider.getCurrent(userId);
  },

  async extendTrial(_userId, _extraDays) {
    throw new Error('extendTrial no está soportado por App Store en este momento.');
  },
};

export async function restoreApplePurchases(userId: string): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await runBillingExclusive(async () => {
    if (getPendingPurchase()) return;
    try {
      await ensureConnection();
      const purchases = (await getAvailablePurchases()) as unknown as Purchase[] | undefined;
      if (!purchases?.length) return;
      for (const p of purchases) {
        if (!parseAppleProductId(p.productId)) continue;
        const key = purchaseDedupeKey(p);
        if (!key) continue;
        try {
          await verifyPurchaseOnce(key, () => verifyOnBackend(userId, p.productId, p));
          await finishTransaction({ purchase: p, isConsumable: false });
        } catch (err) {
          console.warn('[appleIAP] restore failed for', p.productId, err);
        }
      }
    } catch (err) {
      console.warn('[appleIAP] restoreApplePurchases error:', err);
    }
  });
}

export async function shutdownAppleBilling(): Promise<void> {
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
    console.warn('[appleIAP] shutdown error:', err);
  }
}
