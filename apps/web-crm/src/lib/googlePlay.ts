/**
 * Cliente de Google Play Developer API (Android Publisher v3).
 *
 * Se usa para:
 *   - Verificar purchase tokens entrantes desde la app movil
 *     (purchases.subscriptionsv2.get) en /api/billing/google/verify.
 *   - Acknowledge de la suscripcion (sin esto Play reembolsa a las 72h).
 *   - Aceptar Real-Time Developer Notifications (RTDN) y refrescar el
 *     estado de la sub leyendo subscriptionsv2.
 *
 * Credenciales: una service account de Google Cloud con el rol
 * "Service Account User" + acceso "View financial data, orders, and
 * cancellation survey responses" en Play Console (Settings > API access).
 *
 * Se carga desde GOOGLE_PLAY_SERVICE_ACCOUNT_B64 (JSON en base64) — asi
 * cabe en una sola env var sin escapes de saltos de linea.
 */
import { google, type androidpublisher_v3 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.t2tacademy.mobile';

let cachedClient: androidpublisher_v3.Androidpublisher | null = null;

/** Decodifica la service account desde la env y devuelve el cliente Android Publisher. */
function getClient(): androidpublisher_v3.Androidpublisher {
  if (cachedClient) return cachedClient;

  const b64 = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_B64;
  if (!b64) {
    throw new Error(
      'GOOGLE_PLAY_SERVICE_ACCOUNT_B64 no esta configurada — no se puede llamar a Google Play.',
    );
  }
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  } catch (err) {
    throw new Error(
      'GOOGLE_PLAY_SERVICE_ACCOUNT_B64 invalida: tiene que ser el JSON de la service account en base64.',
    );
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: String(credentials.client_email || ''),
      private_key: String(credentials.private_key || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  cachedClient = google.androidpublisher({ version: 'v3', auth });
  return cachedClient;
}

export function getPackageName(): string {
  return PACKAGE_NAME;
}

/**
 * purchases.subscriptionsv2.get
 *
 * Devuelve el estado unificado de la suscripcion (active, in_grace,
 * canceled, expired, paused, pending) + lineItems con productId, expiryTime,
 * offerDetails (basePlanId, offerId, offerTags) y externalAccountIdentifiers
 * (obfuscatedExternalAccountId = userId que mandamos en el client).
 */
export async function getSubscriptionV2(
  purchaseToken: string,
  packageName: string = PACKAGE_NAME,
): Promise<androidpublisher_v3.Schema$SubscriptionPurchaseV2> {
  const client = getClient();
  const { data } = await client.purchases.subscriptionsv2.get({
    packageName,
    token: purchaseToken,
  });
  return data;
}

/**
 * Acknowledge legacy (v1) — sigue siendo el unico endpoint para confirmar
 * una compra de subs. Sin esto Play reembolsa el cobro a las 72hs.
 *
 * Es idempotente: si ya estaba acknowledged Google devuelve 200 igual.
 */
export async function acknowledgeSubscription(
  productId: string,
  purchaseToken: string,
  packageName: string = PACKAGE_NAME,
): Promise<void> {
  const client = getClient();
  try {
    await client.purchases.subscriptions.acknowledge({
      packageName,
      subscriptionId: productId,
      token: purchaseToken,
    });
  } catch (err: unknown) {
    // Si el ack falla con 400 "Subscription already acknowledged" lo tratamos como OK.
    const e = err as { code?: number; errors?: Array<{ message?: string }> };
    const msg = e?.errors?.[0]?.message || '';
    if (e?.code === 400 && /already.*acknowledged/i.test(msg)) return;
    throw err;
  }
}

/**
 * purchases.subscriptions.defer
 *
 * Extiende la suscripcion hasta `desiredExpiryTime`. Util si en el futuro
 * implementamos cupones trial_extension sobre Play. Hoy no se usa.
 */
export async function deferSubscription(
  productId: string,
  purchaseToken: string,
  expectedExpiryTimeMs: number,
  desiredExpiryTimeMs: number,
  packageName: string = PACKAGE_NAME,
): Promise<androidpublisher_v3.Schema$SubscriptionPurchasesDeferResponse> {
  const client = getClient();
  const { data } = await client.purchases.subscriptions.defer({
    packageName,
    subscriptionId: productId,
    token: purchaseToken,
    requestBody: {
      deferralInfo: {
        expectedExpiryTimeMillis: String(expectedExpiryTimeMs),
        desiredExpiryTimeMillis: String(desiredExpiryTimeMs),
      },
    },
  });
  return data;
}

// ============================================================================
// SKU mapping (espejo de apps/mobile/src/services/billing/googlePlaySkus.ts)
// ============================================================================

export type CanonicalPlanId = 'free' | 'pro' | 'elite';
export type BillingCycle = 'monthly' | 'yearly';

const PLAY_SKUS: Record<Exclude<CanonicalPlanId, 'free'>, Record<BillingCycle, string>> = {
  pro: { monthly: 't2t_pro_monthly', yearly: 't2t_pro_yearly' },
  elite: { monthly: 't2t_black_monthly', yearly: 't2t_black_yearly' },
};

/** Resuelve productId -> {planId, cycle}. Devuelve null si el SKU no es nuestro. */
export function parsePlayProductId(
  productId: string,
): { planId: Exclude<CanonicalPlanId, 'free'>; cycle: BillingCycle } | null {
  for (const planId of Object.keys(PLAY_SKUS) as Array<Exclude<CanonicalPlanId, 'free'>>) {
    for (const cycle of ['monthly', 'yearly'] as BillingCycle[]) {
      if (PLAY_SKUS[planId][cycle] === productId) return { planId, cycle };
    }
  }
  return null;
}

/** True si la subscription tiene un offer con tag `trial-7d` aplicado. */
export function hasTrialOffer(sub: androidpublisher_v3.Schema$SubscriptionPurchaseV2): boolean {
  const items = sub.lineItems || [];
  return items.some((item) => {
    const tags = item.offerDetails?.offerTags || [];
    return tags.includes('trial-7d') || item.offerDetails?.offerId === 'trial-7d';
  });
}

/** Extrae el lineItem principal (subs T2T tiene siempre 1 sólo line item). */
export function getPrimaryLineItem(
  sub: androidpublisher_v3.Schema$SubscriptionPurchaseV2,
): androidpublisher_v3.Schema$SubscriptionPurchaseLineItem | null {
  const items = sub.lineItems || [];
  return items[0] || null;
}

/** Helper: convierte el subscriptionState de Play a nuestro SubscriptionStatus. */
export function mapSubscriptionState(
  state: string | null | undefined,
  hasTrial: boolean,
): 'free' | 'trialing' | 'active' | 'cancelled' | 'expired' {
  switch (state) {
    case 'SUBSCRIPTION_STATE_ACTIVE':
      return hasTrial ? 'trialing' : 'active';
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
      // Mantiene acceso pero hay un problema de pago. Lo tratamos como
      // 'cancelled' para que getEffectiveStatus mantenga el acceso hasta
      // que renewsAt expire o RTDN actualice.
      return 'cancelled';
    case 'SUBSCRIPTION_STATE_ON_HOLD':
    case 'SUBSCRIPTION_STATE_PAUSED':
      return 'cancelled';
    case 'SUBSCRIPTION_STATE_CANCELED':
      return 'cancelled';
    case 'SUBSCRIPTION_STATE_EXPIRED':
      return 'expired';
    case 'SUBSCRIPTION_STATE_PENDING':
      return 'free';
    default:
      return 'free';
  }
}
