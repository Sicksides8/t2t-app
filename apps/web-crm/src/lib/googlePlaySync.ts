/**
 * googlePlaySync — fuente de verdad para persistir compras de Google Play
 * en Firestore. Lo usan POST /api/billing/google/verify y POST
 * /api/billing/google/rtdn (Pub/Sub).
 *
 * Responsabilidades:
 *   1. Llamar a purchases.subscriptionsv2.get para tener el estado real.
 *   2. Acknowledge si Play todavia no recibio el ack (sino reembolsa 72h).
 *   3. Upsertar t2t_subscriptions/{userId} con el shape canonico.
 *   4. Upsertar t2t_payments/{latestOrderId} para historial / MRR.
 *   5. Espejar t2t_users/{uid} (subscriptionPlan, status, renewsAt).
 *
 * Idempotente: si el mismo latestOrderId entra dos veces (verify + RTDN
 * RENEWED), las escrituras son `set merge` y el doc de payment usa el
 * orderId como key.
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

  // Ultimo recurso: ver si tenemos un subscription previo con linkedPurchaseToken
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
 *
 * @param purchaseToken token recibido (de /verify o de RTDN.purchaseToken)
 * @param packageName package name (default: GOOGLE_PLAY_PACKAGE_NAME)
 * @param explicitUserId si /verify lo mando, se usa con prioridad
 * @param sourceEvent 'verify' (escribe payment SIEMPRE) | 'rtdn' (escribe payment solo en eventos de cobro)
 * @param paidEvent indica si la persistencia debe crear payment doc (RTDN: RENEWED, RECOVERED, PURCHASED)
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
      // No tiramos: el ack es importante pero no debe bloquear el grant.
    }
  }

  // ---- Subscription doc ----
  const subRef = adminDb.collection(FS_COL.subscriptions).doc(userId);
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
  if (sub.latestOrderId) subPayload.latestOrderId = sub.latestOrderId;
  if (isTrial) {
    subPayload.trialStartedAt = startTs;
    subPayload.trialEndsAt = endTs;
  } else {
    subPayload.trialStartedAt = FieldValue.delete();
    subPayload.trialEndsAt = FieldValue.delete();
  }
  if (status === 'cancelled' || sub.canceledStateContext) {
    // El SDK no expone una fecha exacta de cancelacion en el shape v2;
    // usamos serverTimestamp como mejor aproximacion del momento en que
    // RTDN nos avisa. El acceso real se sigue rigiendo por endDate.
    subPayload.cancelledAt = FieldValue.serverTimestamp();
  } else {
    subPayload.cancelledAt = FieldValue.delete();
  }
  await subRef.set(subPayload, { merge: true });

  // ---- Payment doc (solo en eventos de cobro: verify inicial o renewals) ----
  const orderId = sub.latestOrderId || null;
  const shouldWritePayment = sourceEvent === 'verify' || paidEvent === true;
  if (shouldWritePayment && orderId) {
    const paymentRow = mapPlayPurchaseToPayment({
      userId,
      productId: lineItem.productId,
      sub,
    });
    if (paymentRow) {
      const paidAtMs = paymentRow.paidAt ? Date.parse(paymentRow.paidAt) : Date.now();
      await adminDb.collection(FS_COL.payments).doc(orderId).set(
        {
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
        },
        { merge: true },
      );
    }
  }

  // ---- Mirror en t2t_users ----
  await adminDb
    .collection(FS_COL.users)
    .doc(userId)
    .set(
      {
        subscriptionId: userId,
        subscriptionPlan: planId,
        subscriptionStatus: status,
        subscriptionSource: 'google',
        subscriptionRenewsAt: endTs,
        ...(isTrial ? { trialStartedAt: startTs, trialEndsAt: endTs } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

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
