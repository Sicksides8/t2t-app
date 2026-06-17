import { Timestamp } from 'firebase-admin/firestore';
import type { androidpublisher_v3 } from 'googleapis';
import type { PaymentRow, PaymentStatus, PaymentMethod, PaymentCycle } from '../types';
import { getCanonicalPlan, monthlyPriceFor } from './plans';
import { hasTrialOffer, parsePlayProductId } from './googlePlay';

export function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
  }
  return null;
}

export function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed) : null;
  }
  return null;
}

const ALLOWED_METHODS: PaymentMethod[] = [
  'Apple IAP',
  'Apple Pay',
  'Google Play',
  'Stripe',
  'MercadoPago',
  'Mock',
];

function normalizeMethod(raw: unknown): PaymentMethod {
  const s = String(raw || '').trim();
  return (ALLOWED_METHODS as string[]).includes(s) ? (s as PaymentMethod) : 'Mock';
}

function normalizeStatus(raw: unknown): PaymentStatus {
  const s = String(raw || 'paid').toLowerCase();
  if (s === 'refunded' || s === 'pending' || s === 'paid') return s;
  return 'paid';
}

function normalizeCycle(raw: unknown): PaymentCycle | undefined {
  const s = String(raw || '').toLowerCase();
  if (s === 'monthly' || s === 'yearly') return s;
  return undefined;
}

/**
 * Mapea un doc de t2t_payments a PaymentRow (serializable a JSON).
 * Tolerante con campos faltantes / tipos legacy.
 */
export function mapPaymentDoc(id: string, data: Record<string, unknown>): PaymentRow {
  return {
    id,
    userId: String(data.userId || ''),
    plan: String(data.plan || data.planId || 'free'),
    planLabel: String(data.planLabel || ''),
    amount: typeof data.amount === 'number' ? data.amount : Number(data.amount || 0),
    currency: String(data.currency || 'USD'),
    method: normalizeMethod(data.method),
    txId: String(data.txId || id),
    paidAt: toIso(data.paidAt),
    status: normalizeStatus(data.status),
    cycle: normalizeCycle(data.cycle),
    couponCode: data.couponCode ? String(data.couponCode) : undefined,
  };
}

/**
 * Convierte una respuesta de purchases.subscriptionsv2.get (Play) en un
 * `PaymentRow` listo para escribir en `t2t_payments/{orderId}`.
 *
 * Usado por googlePlaySync.syncSubscriptionFromPlay y disponible para
 * cualquier futura herramienta admin que necesite proyectar un purchase
 * de Play sin reescribir el mapping.
 *
 * - Si la sub esta en trial (offer trial-7d), devuelve amount=0 y status=pending
 *   (Play recien cobra al terminar el trial — el primer cobro real entra como
 *   un evento RENEWED separado).
 * - Currency y amount se toman del catalogo canonico de planes, NO del precio
 *   localizado que Google reporta, para que MRR / LTV sigan en USD.
 */
export function mapPlayPurchaseToPayment(params: {
  userId: string;
  productId: string;
  sub: androidpublisher_v3.Schema$SubscriptionPurchaseV2;
}): PaymentRow | null {
  const { userId, productId, sub } = params;
  const parsed = parsePlayProductId(productId);
  if (!parsed) return null;
  const orderId = sub.latestOrderId;
  if (!orderId) return null;

  const { planId, cycle } = parsed;
  const isTrial = hasTrialOffer(sub);
  const canonical = getCanonicalPlan(planId);
  const amount = isTrial
    ? 0
    : canonical
      ? cycle === 'yearly'
        ? canonical.priceYearly
        : canonical.priceMonthly
      : monthlyPriceFor(planId, cycle);
  const currency = canonical?.currency || 'USD';
  const planName = canonical?.name || planId.toUpperCase();
  const cycleLabel = cycle === 'yearly' ? 'anual' : 'mensual';

  const startMs = sub.startTime ? Date.parse(sub.startTime) : Date.now();

  return {
    id: orderId,
    userId,
    plan: planId,
    planLabel: `${planName} · ${cycleLabel}`,
    amount,
    currency,
    method: 'Google Play',
    txId: `#${orderId}`,
    paidAt: new Date(isTrial ? Date.now() : startMs).toISOString(),
    status: isTrial ? 'pending' : 'paid',
    cycle,
  };
}
