/**
 * MOCK BILLING PROVIDER — Fase 1.
 *
 * Simula compras sin tocar pasarela real. Persiste en Firestore exactamente
 * lo que persistiría MercadoPago / Apple IAP / Google Play para que migrar
 * sea drop-in: sólo hay que cambiar `getBillingProvider()` en
 * subscriptionService.ts.
 *
 * Persistencia:
 *   - t2t_subscriptions/{userId}       1 doc por user (sobrescribible)
 *   - t2t_payments/{txId}              1 doc por cobro
 *   - t2t_users/{uid}                  espejo de campos (subscriptionPlan, status, etc.)
 *
 * TODO MERCADOPAGO: reemplazar este provider por mercadoPagoProvider.ts
 * que llame al SDK de MercadoPago Mobile (preference + payment) y reciba
 * el webhook desde el backend (apps/web-crm) para actualizar el doc.
 * Mientras tanto, este mock es el único provider del Strategy Pattern.
 */
import { Platform } from 'react-native';
import { Timestamp, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from './firebase';
import { updateUserFields } from './authService';
import { getCanonicalPlan } from './subscriptionService';
import type {
  BillingCycle,
  Payment,
  Subscription,
  SubscriptionPlanId,
  SubscriptionSource,
  SubscriptionStatus,
} from '../types';
import type { IBillingProvider } from './subscriptionService';

// ---------- helpers ----------

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY_MS);
}

function planLabel(planId: SubscriptionPlanId, cycle: BillingCycle): string {
  const name = planId.toUpperCase();
  const cycleLabel = cycle === 'yearly' ? 'anual' : 'mensual';
  return `${name} · ${cycleLabel}`;
}

function defaultMethod(source: SubscriptionSource): Payment['method'] {
  if (source === 'apple') return 'Apple IAP';
  if (source === 'google') return 'Google Play';
  if (source === 'mercadopago') return 'MercadoPago';
  if (source === 'code') return 'Mock';
  return Platform.OS === 'ios' ? 'Apple IAP' : 'Google Play';
}

function generateTxId(planId: SubscriptionPlanId): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MOCK-${planId.toUpperCase()}-${stamp}-${rand}`;
}

function toDate(v: any): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === 'function') return v.toDate();
  return undefined;
}

function mapSubscriptionDoc(userId: string, data: any): Subscription | null {
  if (!data) return null;
  const startDate = toDate(data.startDate) || new Date();
  const endDate = toDate(data.endDate) || startDate;
  return {
    id: data.id || userId,
    userId,
    planId: (data.planId || 'free') as SubscriptionPlanId,
    status: (data.status || 'free') as SubscriptionStatus,
    source: (data.source || 'mock') as SubscriptionSource,
    cycle: (data.cycle || 'monthly') as BillingCycle,
    startDate,
    endDate,
    trialStartedAt: toDate(data.trialStartedAt),
    trialEndsAt: toDate(data.trialEndsAt),
    cancelledAt: toDate(data.cancelledAt),
    couponCode: typeof data.couponCode === 'string' ? data.couponCode : undefined,
    discountPercent: typeof data.discountPercent === 'number' ? data.discountPercent : undefined,
  };
}

async function writeSubscription(sub: Subscription): Promise<void> {
  const payload: Record<string, unknown> = {
    id: sub.id,
    userId: sub.userId,
    planId: sub.planId,
    status: sub.status,
    source: sub.source,
    cycle: sub.cycle,
    startDate: Timestamp.fromDate(sub.startDate),
    endDate: Timestamp.fromDate(sub.endDate),
    updatedAt: serverTimestamp(),
  };
  if (sub.trialStartedAt) payload.trialStartedAt = Timestamp.fromDate(sub.trialStartedAt);
  if (sub.trialEndsAt) payload.trialEndsAt = Timestamp.fromDate(sub.trialEndsAt);
  if (sub.cancelledAt) payload.cancelledAt = Timestamp.fromDate(sub.cancelledAt);
  if (sub.couponCode) payload.couponCode = sub.couponCode;
  if (typeof sub.discountPercent === 'number') payload.discountPercent = sub.discountPercent;

  await setDoc(doc(db, FS_COL.subscriptions, sub.userId), payload, { merge: true });
}

async function writePayment(payment: Payment): Promise<void> {
  const payload: Record<string, unknown> = {
    id: payment.id,
    userId: payment.userId,
    plan: payment.plan,
    planLabel: payment.planLabel,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    txId: payment.txId,
    paidAt: Timestamp.fromDate(payment.paidAt),
    status: payment.status,
    createdAt: serverTimestamp(),
  };
  if (payment.cycle) payload.cycle = payment.cycle;
  if (payment.couponCode) payload.couponCode = payment.couponCode;
  await setDoc(doc(db, FS_COL.payments, payment.id), payload);
}

async function mirrorToUser(userId: string, sub: Subscription): Promise<void> {
  await updateUserFields(userId, {
    subscriptionPlan: sub.planId,
    subscriptionStatus: sub.status,
    subscriptionSource: sub.source,
    trialStartedAt: sub.trialStartedAt,
    trialEndsAt: sub.trialEndsAt,
    subscriptionRenewsAt: sub.endDate,
    subscriptionCancelledAt: sub.cancelledAt,
    subscriptionId: sub.id,
  });
}

// ---------- provider ----------

export const mockBillingProvider: IBillingProvider = {
  async startTrial(userId, planId) {
    if (planId === 'free') {
      throw new Error('No se puede iniciar trial sobre el plan FREE.');
    }
    const plan = getCanonicalPlan(planId);
    const now = new Date();
    const trialEndsAt = addDays(now, plan.trialDays || 7);

    const sub: Subscription = {
      id: userId,
      userId,
      planId,
      status: 'trialing',
      source: 'mock',
      cycle: 'monthly',
      startDate: now,
      endDate: trialEndsAt,
      trialStartedAt: now,
      trialEndsAt,
    };

    await writeSubscription(sub);
    await mirrorToUser(userId, sub);
    return sub;
  },

  async subscribe(userId, planId, cycle, source, options) {
    if (planId === 'free') {
      throw new Error('No se puede suscribir al plan FREE — usá cancel() en su lugar.');
    }
    const plan = getCanonicalPlan(planId);
    const now = new Date();
    // TODO MERCADOPAGO: en producción el ciclo anual debe consumir el SKU
    // anual de MP/IAP. Fase 1 cobra monthly siempre aunque cycle === 'yearly'.
    const renewDays = cycle === 'yearly' ? 365 : 30;
    const endDate = addDays(now, renewDays);

    const basePrice = cycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const discountPercent = options?.discountPercent ?? 0;
    const finalAmount = Math.max(0, Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100);

    const sub: Subscription = {
      id: userId,
      userId,
      planId,
      status: 'active',
      source,
      cycle,
      startDate: now,
      endDate,
      couponCode: options?.couponCode,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
    };

    await writeSubscription(sub);

    const payment: Payment = {
      id: generateTxId(planId),
      userId,
      plan: planId,
      planLabel: planLabel(planId, cycle),
      amount: finalAmount,
      currency: plan.currency,
      method: defaultMethod(source),
      txId: '#' + generateTxId(planId),
      paidAt: now,
      status: 'paid',
      cycle,
      couponCode: options?.couponCode,
    };
    await writePayment(payment);
    await mirrorToUser(userId, sub);
    return sub;
  },

  async cancel(userId) {
    const current = await this.getCurrent(userId);
    if (!current) {
      throw new Error('No hay suscripción para cancelar.');
    }
    const now = new Date();
    const sub: Subscription = {
      ...current,
      status: 'cancelled',
      cancelledAt: now,
    };
    await writeSubscription(sub);
    await mirrorToUser(userId, sub);
    return sub;
  },

  async changePlan(userId, newPlanId) {
    const current = await this.getCurrent(userId);
    // TODO MERCADOPAGO: en producción cambiar de plan implica proration con
    // la pasarela. En el mock simplemente abrimos una nueva suscripción.
    const cycle: BillingCycle = current?.cycle === 'yearly' ? 'yearly' : 'monthly';
    const source: SubscriptionSource = current?.source ?? 'mock';
    if (newPlanId === 'free') {
      return this.cancel(userId);
    }
    return this.subscribe(userId, newPlanId, cycle, source);
  },

  async getCurrent(userId) {
    const snap = await getDoc(doc(db, FS_COL.subscriptions, userId));
    if (!snap.exists()) return null;
    return mapSubscriptionDoc(userId, snap.data());
  },

  async extendTrial(userId, extraDays) {
    const current = await this.getCurrent(userId);
    if (!current) {
      throw new Error('No hay suscripción para extender.');
    }
    const base = current.trialEndsAt ?? current.endDate ?? new Date();
    const newEnd = addDays(base, extraDays);
    const sub: Subscription = {
      ...current,
      status: 'trialing',
      trialEndsAt: newEnd,
      endDate: newEnd,
    };
    await writeSubscription(sub);
    await mirrorToUser(userId, sub);
    return sub;
  },
};
