/**
 * POST /api/billing/google/rtdn
 *
 * Endpoint receptor de Real-Time Developer Notifications (RTDN) de Google
 * Play, delivered via Cloud Pub/Sub Push.
 *
 * Configuración (one-shot, en Google Cloud + Play Console):
 *   1. Crear topic Pub/Sub `t2t-play-rtdn`.
 *   2. Crear push subscription apuntando a:
 *        https://<crm-host>/api/billing/google/rtdn?token=<GOOGLE_PLAY_RTDN_VERIFY_TOKEN>
 *   3. Play Console > Monetization setup > Real-time developer notifications:
 *      Pegar el topic name `projects/<project-id>/topics/t2t-play-rtdn`.
 *
 * Seguridad: validamos el query token (?token=...) contra
 * GOOGLE_PLAY_RTDN_VERIFY_TOKEN. Si no coincide, 401. Esto es el patron
 * "secret token in URL" recomendado por Pub/Sub para Push subscriptions.
 *
 * Respuesta: SIEMPRE devolvemos 200 cuando logramos parsear el mensaje
 * (aunque internamente falle el sync) para evitar reintentos infinitos de
 * Pub/Sub. Si el parseo falla, devolvemos 400.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { adminDb } from '../../../../../lib/firebase-admin';
import { FS_COL } from '../../../../../lib/firestoreCollections';
import { syncSubscriptionFromPlay } from '../../../../../lib/googlePlaySync';

type PubsubPushBody = {
  message?: {
    data?: string;
    messageId?: string;
    publishTime?: string;
    attributes?: Record<string, string>;
  };
  subscription?: string;
};

type DeveloperNotification = {
  version?: string;
  packageName?: string;
  eventTimeMillis?: string;
  subscriptionNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
  voidedPurchaseNotification?: {
    purchaseToken?: string;
    orderId?: string;
    productType?: number; // 1 = PRODUCT_TYPE_SUBSCRIPTION, 2 = ONE_TIME
    refundType?: number;
  };
  oneTimeProductNotification?: {
    purchaseToken?: string;
    sku?: string;
    notificationType?: number;
  };
  testNotification?: {
    version?: string;
  };
};

// notificationType del subscriptionNotification (oficial de Google).
const SUB_NOTIF = {
  RECOVERED: 1,
  RENEWED: 2,
  CANCELED: 3,
  PURCHASED: 4,
  ON_HOLD: 5,
  IN_GRACE_PERIOD: 6,
  RESTARTED: 7,
  PRICE_CHANGE_CONFIRMED: 8,
  DEFERRED: 9,
  PAUSED: 10,
  PAUSE_SCHEDULE_CHANGED: 11,
  REVOKED: 12,
  EXPIRED: 13,
  PENDING_PURCHASE_CANCELED: 20,
} as const;

const PAID_EVENT_TYPES = new Set<number>([
  SUB_NOTIF.PURCHASED,
  SUB_NOTIF.RENEWED,
  SUB_NOTIF.RECOVERED,
  SUB_NOTIF.RESTARTED,
]);

function checkAuth(request: NextRequest): boolean {
  const expected = process.env.GOOGLE_PLAY_RTDN_VERIFY_TOKEN;
  if (!expected) {
    // En dev: si no hay token configurado, aceptamos (warning).
    console.warn('[google-rtdn] GOOGLE_PLAY_RTDN_VERIFY_TOKEN no configurado — aceptando sin auth.');
    return true;
  }
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  return token === expected;
}

function decodeMessage(body: PubsubPushBody): DeveloperNotification | null {
  if (!body?.message?.data) return null;
  try {
    const json = Buffer.from(body.message.data, 'base64').toString('utf-8');
    return JSON.parse(json) as DeveloperNotification;
  } catch (err) {
    console.error('[google-rtdn] failed to decode message data:', err);
    return null;
  }
}

/**
 * Maneja un voidedPurchaseNotification (refund / chargeback de Play).
 * Marca el payment doc como refunded y, si era subs, deja la sub en
 * `expired` para revocar el acceso al instante.
 */
async function handleVoidedPurchase(
  voided: NonNullable<DeveloperNotification['voidedPurchaseNotification']>,
): Promise<void> {
  const orderId = voided.orderId;
  const purchaseToken = voided.purchaseToken;
  if (!orderId && !purchaseToken) return;

  if (orderId) {
    const payRef = adminDb.collection(FS_COL.payments).doc(orderId);
    const snap = await payRef.get();
    if (snap.exists) {
      await payRef.set(
        { status: 'refunded', refundedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
  }

  // Buscar la sub por purchaseToken para revocar acceso.
  if (purchaseToken) {
    const subSnap = await adminDb
      .collection(FS_COL.subscriptions)
      .where('purchaseToken', '==', purchaseToken)
      .limit(1)
      .get();
    if (!subSnap.empty) {
      const subDoc = subSnap.docs[0];
      const userId = subDoc.data()?.userId as string | undefined;
      const now = Timestamp.now();
      await subDoc.ref.set(
        {
          status: 'expired',
          cancelledAt: now,
          refundedAt: now,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      if (userId) {
        await adminDb
          .collection(FS_COL.users)
          .doc(userId)
          .set(
            { subscriptionStatus: 'expired', updatedAt: FieldValue.serverTimestamp() },
            { merge: true },
          );
      }
    }
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: PubsubPushBody;
  try {
    body = (await request.json()) as PubsubPushBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const notification = decodeMessage(body);
  if (!notification) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const messageId = body.message?.messageId || '-';
  console.log(
    `[google-rtdn] received message=${messageId} package=${notification.packageName} type=${notification.subscriptionNotification?.notificationType ?? notification.testNotification ? 'TEST' : 'voided/other'}`,
  );

  // Test notification de Play Console (sandbox handshake) — solo ack.
  if (notification.testNotification) {
    return NextResponse.json({ ok: true, kind: 'test' });
  }

  // Sub event: refrescamos contra Google y persistimos.
  if (notification.subscriptionNotification) {
    const { notificationType, purchaseToken } = notification.subscriptionNotification;
    if (!purchaseToken || typeof notificationType !== 'number') {
      return NextResponse.json({ ok: true, kind: 'sub-noop' });
    }
    try {
      const paidEvent = PAID_EVENT_TYPES.has(notificationType);
      await syncSubscriptionFromPlay({
        purchaseToken,
        packageName: notification.packageName,
        sourceEvent: 'rtdn',
        paidEvent,
      });
    } catch (err) {
      // Logueamos pero devolvemos 200 para que Pub/Sub no reintente en loop.
      console.error('[google-rtdn] sync failed:', err);
    }
    return NextResponse.json({ ok: true, kind: 'sub' });
  }

  // Refund / chargeback.
  if (notification.voidedPurchaseNotification) {
    try {
      await handleVoidedPurchase(notification.voidedPurchaseNotification);
    } catch (err) {
      console.error('[google-rtdn] voided sync failed:', err);
    }
    return NextResponse.json({ ok: true, kind: 'voided' });
  }

  // One-time products: no soportamos por ahora.
  if (notification.oneTimeProductNotification) {
    console.log('[google-rtdn] one-time product notification ignored');
    return NextResponse.json({ ok: true, kind: 'one-time' });
  }

  return NextResponse.json({ ok: true, kind: 'unknown' });
}

export const dynamic = 'force-dynamic';
