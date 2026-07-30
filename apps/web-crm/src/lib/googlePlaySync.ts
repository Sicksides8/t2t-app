/**
 * googlePlaySync — fuente de verdad para persistir compras de Google Play
 * en Firestore. Lo usan POST /api/billing/google/verify y POST
 * /api/billing/google/rtdn (Pub/Sub).
 *
 * Responsabilidades:
 *   1. Llamar a purchases.subscriptionsv2.get para tener el estado real.
 *   2. Acknowledge si Play todavia no recibio el ack (sino reembolsa 72h).
 *   3. Upsertar t2t_subscriptions/{userId} + espejo t2t_users/{uid} en transacción.
 *   4. Upsertar t2t_payments/{latestOrderId} para historial / MRR.
 *   5. Registrar t2t_billing_events/{dedupeKey} para idempotencia verify/RTDN.
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { androidpublisher_v3 } from 'googleapis';

import { adminDb } from './firebase-admin';
import { FS_COL } from './firestoreCollections';
import {
  acknowledgeSubscription,
  getPrimaryLineItem,
  getSubscriptionV2,
  hasTrialOffer,
  mapSubscriptionState,
  parsePlayProductId,
} from './googlePlay';
import { mapPlayPurchaseToPayment } from './paymentsServer';

type SubscriptionPurchaseV2 = androidpublisher_v3.Schema$SubscriptionPurchaseV2;

export type SyncResult = {
  userId: string;
  productId: string;
  planId: 'pro' | 'elite';
  cycle: 'monthly' | 'yearly';
  status: 'free' | 'trialing' | 'active' | 'cancelled' | 'expired';
  endDateIso: string;
  orderId: string | null;
  acknowledged: boolean;
  /** Snapshot del subscription doc que escribimos (con fechas en ISO). */
  subscription: {
    id: string;
    userId: string;
    planId: 'pro' | 'elite';
    status: SyncResult['status'];
    source: 'google';
    cycle: SyncResult['cycle'];
    startDate: string;
    endDate: string;
    trialStartedAt?: string;
    trialEndsAt?: string;
    cancelledAt?: string;
  };
};

type ExistingSubscriptionDoc = {
  userId?: string;
  purchaseToken?: string;
  endDate?: unknown;
  latestOrderId?: string;
  planId?: 'pro' | 'elite';
  cycle?: 'monthly' | 'yearly';
  status?: SyncResult['status'];
  startDate?: unknown;
  trialStartedAt?: unknown;
  trialEndsAt?: unknown;
  cancelledAt?: unknown;
};

function timestampToMillis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

function timestampToIso(value: unknown): string | undefined {
  const ms = timestampToMillis(value);
  return ms != null ? new Date(ms).toISOString() : undefined;
}

/** Evita que un RTDN tardío del plan anterior pise un upgrade ya confirmado. */
function isStalePlaySubscriptionUpdate(
  existing: ExistingSubscriptionDoc | undefined,
  incoming: { purchaseToken: string; expiryMs: number; linkedPurchaseToken: string | null },
): boolean {
  if (!existing?.purchaseToken) return false;
  const existingToken = String(existing.purchaseToken);
  if (existingToken === incoming.purchaseToken) return false;
  if (incoming.linkedPurchaseToken === existingToken) return false;
  const existingEnd = timestampToMillis(existing.endDate) ?? 0;
  return incoming.expiryMs <= existingEnd;
}

function buildSyncResultFromExisting(
  userId: string,
  existing: ExistingSubscriptionDoc,
  productId: string,
  orderId: string | null,
  acknowledged: boolean,
): SyncResult {
  const planId = existing.planId ?? 'pro';
  const cycle = existing.cycle ?? 'monthly';
  const status = existing.status ?? 'active';
  const startDate = timestampToIso(existing.startDate) ?? new Date().toISOString();
  const endDate = timestampToIso(existing.endDate) ?? startDate;

  return {
    userId,
    productId,
    planId,
    cycle,
    status,
    endDateIso: endDate,
    orderId,
    acknowledged,
    subscription: {
      id: userId,
      userId,
      planId,
      status,
      source: 'google',
      cycle,
      startDate,
      endDate,
      ...(timestampToIso(existing.trialStartedAt)
        ? {
            trialStartedAt: timestampToIso(existing.trialStartedAt),
            trialEndsAt: timestampToIso(existing.trialEndsAt),
          }
        : {}),
      ...(timestampToIso(existing.cancelledAt)
        ? { cancelledAt: timestampToIso(existing.cancelledAt) }
        : {}),
    },
  };
}

/**
 * Resuelve el userId asociado a la compra.
 *
 * Prioridad:
 *  1. `userId` explicito (lo manda /verify desde la app movil).
 *  2. obfuscatedExternalAccountId que el cliente seteo en requestPurchase.
 *  3. Fallback: linkedPurchaseToken -> doc previo en t2t_subscriptions.
 */
async function resolveUserId(
  sub: SubscriptionPurchaseV2,
  explicitUserId?: string,
): Promise<string> {
  if (explicitUserId) return explicitUserId;

  const obfuscated =
    sub.externalAccountIdentifiers?.obfuscatedExternalAccountId ||
    sub.externalAccountIdentifiers?.externalAccountId ||
    null;
  if (obfuscated) return obfuscated;

  const linked = sub.linkedPurchaseToken;
  if (linked) {
    const snap = await adminDb
      .collection(FS_COL.subscriptions)
      .where('purchaseToken', '==', linked)
      .limit(1)
      .get();
    if (!snap.empty) {
      const userId = snap.docs[0].data()?.userId;
      if (typeof userId === 'string' && userId.length > 0) return userId;
    }
  }
  throw new Error(
    'No se pudo resolver el userId para esta compra de Google Play. Faltan obfuscatedAccountId y linkedPurchaseToken.',
  );
}

/**
 * Persiste la sub + payment + espejo en t2t_users. Se llama desde verify y rtdn.
 */
export async function syncSubscriptionFromPlay(params: {
  purchaseToken: string;
  packageName?: string;
  explicitUserId?: string;
  sourceEvent: 'verify' | 'rtdn';
  paidEvent?: boolean;
}): Promise<SyncResult> {
  const { purchaseToken, packageName, explicitUserId, sourceEvent, paidEvent } = params;

  const sub = await getSubscriptionV2(purchaseToken, packageName);
  const lineItem = getPrimaryLineItem(sub);
  if (!lineItem?.productId) {
    throw new Error('La respuesta de Google no tiene productId — verifica el SKU.');
  }
  const parsed = parsePlayProductId(lineItem.productId);
  if (!parsed) {
    throw new Error(`Product ID desconocido: ${lineItem.productId}.`);
  }
  const { planId, cycle } = parsed;
  const userId = await resolveUserId(sub, explicitUserId);

  const isTrial = hasTrialOffer(sub);
  const status = mapSubscriptionState(sub.subscriptionState, isTrial);

  const startMs = sub.startTime ? Date.parse(sub.startTime) : Date.now();
  const expiryMs = lineItem.expiryTime ? Date.parse(lineItem.expiryTime) : startMs;
  const startTs = Timestamp.fromMillis(startMs);
  const endTs = Timestamp.fromMillis(expiryMs);

  const isAcknowledged = sub.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED';
  let acknowledged = isAcknowledged;
  if (!isAcknowledged) {
    try {
      await acknowledgeSubscription(lineItem.productId, purchaseToken, packageName);
      acknowledged = true;
    } catch (err) {
      console.error('[googlePlay] acknowledge failed:', err);
    }
  }

  const orderId = sub.latestOrderId || null;
  const dedupeKey = `${purchaseToken}:${orderId ?? sourceEvent}`;
  const linkedPurchaseToken = sub.linkedPurchaseToken ?? null;

  const subPayload: Record<string, unknown> = {
    id: userId,
    userId,
    planId,
    status,
    source: 'google',
    cycle,
    startDate: startTs,
    endDate: endTs,
    purchaseToken,
    productId: lineItem.productId,
    acknowledged,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (orderId) subPayload.latestOrderId = orderId;
  if (isTrial) {
    subPayload.trialStartedAt = startTs;
    subPayload.trialEndsAt = endTs;
  } else {
    subPayload.trialStartedAt = FieldValue.delete();
    subPayload.trialEndsAt = FieldValue.delete();
  }
  if (status === 'cancelled' || sub.canceledStateContext) {
    subPayload.cancelledAt = FieldValue.serverTimestamp();
  } else {
    subPayload.cancelledAt = FieldValue.delete();
  }

  const userPayload: Record<string, unknown> = {
    subscriptionId: userId,
    subscriptionPlan: planId,
    subscriptionStatus: status,
    subscriptionSource: 'google',
    subscriptionRenewsAt: endTs,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (isTrial) {
    userPayload.trialStartedAt = startTs;
    userPayload.trialEndsAt = endTs;
  }

  const shouldWritePayment = sourceEvent === 'verify' || paidEvent === true;
  let paymentPayload: Record<string, unknown> | null = null;
  if (shouldWritePayment && orderId) {
    const paymentRow = mapPlayPurchaseToPayment({
      userId,
      productId: lineItem.productId,
      sub,
    });
    if (paymentRow) {
      const paidAtMs = paymentRow.paidAt ? Date.parse(paymentRow.paidAt) : Date.now();
      paymentPayload = {
        id: paymentRow.id,
        userId: paymentRow.userId,
        plan: paymentRow.plan,
        planLabel: paymentRow.planLabel,
        amount: paymentRow.amount,
        currency: paymentRow.currency,
        method: paymentRow.method,
        txId: paymentRow.txId,
        paidAt: Timestamp.fromMillis(paidAtMs),
        status: paymentRow.status,
        cycle: paymentRow.cycle,
        createdAt: FieldValue.serverTimestamp(),
      };
    }
  }

  const eventRef = adminDb.collection(FS_COL.billingEvents).doc(dedupeKey);
  const subRef = adminDb.collection(FS_COL.subscriptions).doc(userId);
  const userRef = adminDb.collection(FS_COL.users).doc(userId);
  const paymentRef = orderId ? adminDb.collection(FS_COL.payments).doc(orderId) : null;

  const txOutcome = await adminDb.runTransaction(async (tx) => {
    const [eventSnap, subSnap] = await Promise.all([tx.get(eventRef), tx.get(subRef)]);
    const existing = subSnap.data() as ExistingSubscriptionDoc | undefined;

    if (eventSnap.exists) {
      return { kind: 'duplicate' as const, existing: existing ?? {} };
    }

    if (existing?.userId && existing.userId !== userId) {
      throw new Error('Este purchaseToken ya está asociado a otro usuario.');
    }

    if (
      isStalePlaySubscriptionUpdate(existing, {
        purchaseToken,
        expiryMs,
        linkedPurchaseToken,
      })
    ) {
      tx.set(eventRef, {
        userId,
        purchaseToken,
        orderId,
        productId: lineItem.productId,
        sourceEvent,
        skipped: true,
        reason: 'stale_subscription',
        expiryMs,
        processedAt: FieldValue.serverTimestamp(),
      });
      return { kind: 'stale' as const, existing: existing ?? {} };
    }

    tx.set(subRef, subPayload, { merge: true });
    tx.set(userRef, userPayload, { merge: true });
    tx.set(eventRef, {
      userId,
      purchaseToken,
      orderId,
      productId: lineItem.productId,
      sourceEvent,
      expiryMs,
      processedAt: FieldValue.serverTimestamp(),
    });
    if (paymentRef && paymentPayload) {
      tx.set(paymentRef, paymentPayload, { merge: true });
    }

    return { kind: 'applied' as const };
  });

  if (txOutcome.kind === 'duplicate' || txOutcome.kind === 'stale') {
    if (txOutcome.existing?.planId) {
      return buildSyncResultFromExisting(
        userId,
        txOutcome.existing,
        lineItem.productId,
        orderId,
        acknowledged,
      );
    }
  }

  return {
    userId,
    productId: lineItem.productId,
    planId,
    cycle,
    status,
    endDateIso: new Date(expiryMs).toISOString(),
    orderId,
    acknowledged,
    subscription: {
      id: userId,
      userId,
      planId,
      status,
      source: 'google',
      cycle,
      startDate: new Date(startMs).toISOString(),
      endDate: new Date(expiryMs).toISOString(),
      ...(isTrial
        ? {
            trialStartedAt: new Date(startMs).toISOString(),
            trialEndsAt: new Date(expiryMs).toISOString(),
          }
        : {}),
    },
  };
}
