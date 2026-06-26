/**
 * appleSync — persiste compras de App Store en Firestore.
 *
 * Fase actual: valida productId + usuario autenticado y escribe el entitlement.
 * TODO producción: validar JWS con App Store Server API (StoreKit 2).
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { adminDb } from './firebase-admin';
import { FS_COL } from './firestoreCollections';
import { getApplePlanPrice, parseAppleProductId } from './apple';

export type AppleSyncResult = {
  userId: string;
  productId: string;
  planId: 'pro' | 'elite';
  cycle: 'monthly' | 'yearly';
  status: 'trialing' | 'active';
  endDateIso: string;
  orderId: string;
  subscription: {
    id: string;
    userId: string;
    planId: 'pro' | 'elite';
    status: 'trialing' | 'active';
    source: 'apple';
    cycle: 'monthly' | 'yearly';
    startDate: string;
    endDate: string;
    trialStartedAt?: string;
    trialEndsAt?: string;
  };
};

function cycleDays(cycle: 'monthly' | 'yearly'): number {
  return cycle === 'yearly' ? 365 : 30;
}

export async function syncSubscriptionFromApple(params: {
  userId: string;
  productId: string;
  transactionId?: string;
  purchaseToken?: string;
  originalTransactionId?: string;
  isTrial?: boolean;
}): Promise<AppleSyncResult> {
  const { userId, productId } = params;
  const parsed = parseAppleProductId(productId);
  if (!parsed) {
    throw new Error(`Product ID desconocido: ${productId}`);
  }

  const { planId, cycle } = parsed;
  const orderId =
    params.transactionId ||
    params.originalTransactionId ||
    params.purchaseToken?.slice(0, 64) ||
    `apple-${userId}-${Date.now()}`;

  const now = Date.now();
  const isTrial = params.isTrial === true;
  const status = isTrial ? 'trialing' : 'active';
  const endMs = now + cycleDays(cycle) * 24 * 60 * 60 * 1000;
  const startTs = Timestamp.fromMillis(now);
  const endTs = Timestamp.fromMillis(endMs);

  const subRef = adminDb.collection(FS_COL.subscriptions).doc(userId);
  const subPayload: Record<string, unknown> = {
    id: userId,
    userId,
    planId,
    status,
    source: 'apple',
    cycle,
    startDate: startTs,
    endDate: endTs,
    productId,
    purchaseToken: params.purchaseToken || params.transactionId || orderId,
    latestOrderId: orderId,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (isTrial) {
    subPayload.trialStartedAt = startTs;
    subPayload.trialEndsAt = endTs;
  } else {
    subPayload.trialStartedAt = FieldValue.delete();
    subPayload.trialEndsAt = FieldValue.delete();
  }
  await subRef.set(subPayload, { merge: true });

  const amount = getApplePlanPrice(planId, cycle);
  await adminDb.collection(FS_COL.payments).doc(orderId).set(
    {
      id: orderId,
      userId,
      plan: planId,
      planLabel: `${planId} · ${cycle === 'yearly' ? 'anual' : 'mensual'}`,
      amount,
      currency: 'USD',
      method: 'Apple IAP',
      txId: `#${orderId}`,
      paidAt: startTs,
      status: 'paid',
      cycle,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await adminDb
    .collection(FS_COL.users)
    .doc(userId)
    .set(
      {
        subscriptionId: userId,
        subscriptionPlan: planId,
        subscriptionStatus: status,
        subscriptionSource: 'apple',
        subscriptionRenewsAt: endTs,
        ...(isTrial ? { trialStartedAt: startTs, trialEndsAt: endTs } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return {
    userId,
    productId,
    planId,
    cycle,
    status,
    endDateIso: new Date(endMs).toISOString(),
    orderId,
    subscription: {
      id: userId,
      userId,
      planId,
      status,
      source: 'apple',
      cycle,
      startDate: new Date(now).toISOString(),
      endDate: new Date(endMs).toISOString(),
      ...(isTrial
        ? {
            trialStartedAt: new Date(now).toISOString(),
            trialEndsAt: new Date(endMs).toISOString(),
          }
        : {}),
    },
  };
}
