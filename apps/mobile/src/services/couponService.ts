/**
 * couponService — validación y aplicación de cupones/promociones.
 *
 * Fuente de verdad:
 *   1. t2t_coupons/{CODE}     (Firestore, editable desde el CRM)
 *   2. Fallback al seed local apps/mobile/src/data/coupons.ts si no existe
 *      en Firestore (útil en dev y para no romper la app si la colección
 *      no fue inicializada todavía).
 *
 * Registro de uso:
 *   t2t_subscription_redemptions/{autoId}  (un doc por canje)
 *
 * TODO MERCADOPAGO: cuando exista la pasarela real, la validación del cupón
 * debe hacerla el backend antes de generar la preference. Acá quedará la UI
 * optimista + el resultado real lo refleja el webhook contra la subscription.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from './firebase';
import { seedCoupons } from '../data/coupons';
import { updateUserFields } from './authService';
import { getBillingProvider } from './subscriptionService';
import type { Coupon, Subscription, SubscriptionPlanId } from '../types';

export type CouponApplyResult =
  | { ok: true; coupon: Coupon; message: string; subscription?: Subscription }
  | { ok: false; reason: 'not_found' | 'inactive' | 'expired' | 'exhausted' | 'error'; message: string };

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function fromFirestoreCoupon(data: any): Coupon | null {
  if (!data || typeof data.code !== 'string') return null;
  const validUntil = data.validUntil?.toDate?.();
  return {
    code: data.code.toUpperCase(),
    kind: data.kind,
    value: typeof data.value === 'number' ? data.value : 0,
    unlocksPlan: data.unlocksPlan,
    extendsTrialDays: typeof data.extendsTrialDays === 'number' ? data.extendsTrialDays : undefined,
    validUntil,
    maxRedemptions: typeof data.maxRedemptions === 'number' ? data.maxRedemptions : undefined,
    redemptionsCount: typeof data.redemptionsCount === 'number' ? data.redemptionsCount : undefined,
    isActive: data.isActive !== false,
    description: typeof data.description === 'string' ? data.description : undefined,
  };
}

export async function validateCoupon(code: string): Promise<Coupon | null> {
  const key = normalizeCode(code);
  try {
    const snap = await getDoc(doc(db, FS_COL.coupons, key));
    if (snap.exists()) {
      const c = fromFirestoreCoupon(snap.data());
      if (c) return c;
    }
  } catch {
    // Firestore puede no estar configurado o no haber red — caemos al seed.
  }
  return seedCoupons.find((c) => c.code === key) ?? null;
}

async function recordRedemption(userId: string, code: string, kind: Coupon['kind']): Promise<void> {
  try {
    await addDoc(collection(db, FS_COL.subscriptionRedemptions), {
      userId,
      code,
      kind,
      createdAt: serverTimestamp(),
    });
  } catch {
    // No bloqueamos el flujo si Firestore no acepta el log; la subscription
    // ya quedó persistida por el provider.
  }
}

/**
 * Aplica el cupón al user. Según `kind`:
 *  - percent / amount   -> subscribe inmediato con descuento (cobro mock).
 *  - trial_extension    -> extiende el trial vigente N días.
 *  - unlock_plan        -> subscribe gratis al plan indicado, source='code'.
 */
export async function applyCouponToUser(userId: string, rawCode: string): Promise<CouponApplyResult> {
  const code = normalizeCode(rawCode);
  if (!code) {
    return { ok: false, reason: 'not_found', message: 'Ingresá un código.' };
  }

  const coupon = await validateCoupon(code);
  if (!coupon) {
    return { ok: false, reason: 'not_found', message: 'Cupón no válido.' };
  }
  if (!coupon.isActive) {
    return { ok: false, reason: 'inactive', message: 'Este cupón ya no está activo.' };
  }
  if (coupon.validUntil && coupon.validUntil.getTime() < Date.now()) {
    return { ok: false, reason: 'expired', message: 'Este cupón ya venció.' };
  }
  if (
    typeof coupon.maxRedemptions === 'number' &&
    typeof coupon.redemptionsCount === 'number' &&
    coupon.redemptionsCount >= coupon.maxRedemptions
  ) {
    return { ok: false, reason: 'exhausted', message: 'Este cupón ya alcanzó su límite de usos.' };
  }

  const provider = getBillingProvider();

  try {
    let subscription: Subscription | undefined;
    let message = '';

    if (coupon.kind === 'trial_extension') {
      const days = coupon.extendsTrialDays ?? coupon.value ?? 0;
      const current = await provider.getCurrent(userId);
      if (current) {
        subscription = await provider.extendTrial(userId, days);
      } else {
        // Sin suscripción previa arrancamos un trial PRO y luego lo extendemos.
        await provider.startTrial(userId, 'pro');
        subscription = await provider.extendTrial(userId, days);
      }
      message = `Trial extendido ${days} días.`;
    } else if (coupon.kind === 'unlock_plan') {
      const planId: SubscriptionPlanId = coupon.unlocksPlan ?? 'pro';
      subscription = await provider.subscribe(userId, planId, 'monthly', 'code', {
        couponCode: coupon.code,
        discountPercent: 100,
      });
      message = `Plan ${planId.toUpperCase()} activado por 30 días sin cargo.`;
    } else if (coupon.kind === 'percent' || coupon.kind === 'amount') {
      const current = await provider.getCurrent(userId);
      const planId: SubscriptionPlanId = current?.planId && current.planId !== 'free' ? current.planId : 'pro';
      const discountPercent =
        coupon.kind === 'percent' ? coupon.value : Math.min(100, Math.round((coupon.value / 9.9) * 100));
      subscription = await provider.subscribe(userId, planId, 'monthly', 'code', {
        couponCode: coupon.code,
        discountPercent,
      });
      message = coupon.kind === 'percent'
        ? `Descuento ${coupon.value}% aplicado en tu próximo cobro.`
        : `Descuento de USD ${coupon.value} aplicado.`;
    } else {
      return { ok: false, reason: 'error', message: 'Tipo de cupón no soportado.' };
    }

    await updateUserFields(userId, { appliedCouponCode: coupon.code });
    await recordRedemption(userId, coupon.code, coupon.kind);

    return { ok: true, coupon, message, subscription };
  } catch (err) {
    return { ok: false, reason: 'error', message: 'No se pudo aplicar el cupón. Intentá de nuevo.' };
  }
}
