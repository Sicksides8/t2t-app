import { Timestamp } from 'firebase-admin/firestore';
import type { PaymentRow, PaymentStatus, PaymentMethod, PaymentCycle } from '../types';

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
