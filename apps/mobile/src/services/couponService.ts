/**
 * couponService — validación y aplicación de códigos promocionales reales.
 *
 * Fuente de verdad ÚNICA:
 *   t2t_subscription_codes/{CODE}   (creado desde el CRM en /codes)
 *
 * Registro de uso:
 *   t2t_subscription_redemptions/{autoId}   (un doc por canje)
 *   t2t_users/{uid}.appliedCouponCode       (último cupón aplicado al user)
 *   t2t_subscription_codes/{CODE}.used      (single-use; transacción atómica)
 *
 * Reglas de negocio:
 *   - Bloqueamos el canje si el usuario YA tiene plan pago activo
 *     (hasActivePaidPlan). Los códigos son sólo para activar el primer plan.
 *   - Si `appliesTo === 'pro' | 'elite'` se fuerza ese plan.
 *   - Si `appliesTo === 'any_paid'` se usa `opts.preferredPlan` o
 *     `user.selectedPlan` o 'pro' como fallback.
 *   - `discountPercent === 100` => alta gratis por `durationDays`.
 *   - `discountPercent` entre 1-99 => subscribe con el descuento aplicado al
 *     primer cobro (mockBillingProvider lo refleja en el Payment).
 *
 * TODO MERCADOPAGO: cuando exista la pasarela real, la validación + write
 * del code lo hace el backend antes de generar la preference. Aquí quedará
 * la UI optimista + result reflejado por el webhook.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from './firebase';
import { getUserProfile, updateUserFields } from './authService';
import { getBillingProvider } from './subscriptionService';
import { hasActivePaidPlan } from '../utils/subscriptionAccess';
import { getPlanDisplayName } from '../utils/planDisplay';
import type {
  Subscription,
  SubscriptionCode,
  SubscriptionCodeAppliesTo,
  SubscriptionPlanId,
  User,
} from '../types';

export type CodeApplyReason =
  | 'empty'
  | 'not_found'
  | 'used'
  | 'expired'
  | 'invalid'
  | 'already_paid'
  | 'race'
  | 'error';

export type CodeApplyResult =
  | {
      ok: true;
      code: SubscriptionCode;
      targetPlan: SubscriptionPlanId;
      durationDays: number;
      discountPercent: number;
      subscription?: Subscription;
      message: string;
    }
  | { ok: false; reason: CodeApplyReason; message: string };

export interface ApplyCodeOptions {
  /**
   * Plan deseado cuando el código es `appliesTo === 'any_paid'`. Si no se
   * pasa, se usa `user.selectedPlan` y, como último fallback, 'pro'.
   */
  preferredPlan?: SubscriptionPlanId;
}

const VALID_APPLIES_TO: SubscriptionCodeAppliesTo[] = ['pro', 'elite', 'any_paid'];

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function toDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof (v as { toDate?: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate();
  }
  return undefined;
}

function fromFirestoreCode(id: string, data: Record<string, unknown>): SubscriptionCode | null {
  if (!data) return null;
  const discountPercent = Number(data.discountPercent);
  if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
    return null;
  }
  const appliesTo = data.appliesTo as SubscriptionCodeAppliesTo | undefined;
  if (!appliesTo || !VALID_APPLIES_TO.includes(appliesTo)) {
    return null;
  }
  const durationDays = Number(data.durationDays);
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    return null;
  }
  return {
    code: id.toUpperCase(),
    title: typeof data.title === 'string' ? data.title : undefined,
    discountPercent,
    appliesTo,
    durationDays,
    expiresAt: toDate(data.expiresAt),
    used: Boolean(data.used),
    usedBy: typeof data.usedBy === 'string' ? data.usedBy : undefined,
    usedAt: toDate(data.usedAt),
  };
}

export async function validateCode(rawCode: string): Promise<SubscriptionCode | null> {
  const code = normalizeCode(rawCode);
  if (!code) return null;
  try {
    const snap = await getDoc(doc(db, FS_COL.subscriptionCodes, code));
    if (!snap.exists()) return null;
    return fromFirestoreCode(snap.id, snap.data() as Record<string, unknown>);
  } catch {
    return null;
  }
}

function resolveTargetPlan(
  code: SubscriptionCode,
  user: User | null | undefined,
  opts?: ApplyCodeOptions,
): SubscriptionPlanId {
  if (code.appliesTo === 'pro') return 'pro';
  if (code.appliesTo === 'elite') return 'elite';
  if (opts?.preferredPlan && opts.preferredPlan !== 'free') return opts.preferredPlan;
  const selected = user?.selectedPlan;
  if (selected === 'pro' || selected === 'elite') return selected;
  return 'pro';
}

function planLabel(plan: SubscriptionPlanId): string {
  return getPlanDisplayName(plan);
}

function buildSuccessMessage(
  code: SubscriptionCode,
  targetPlan: SubscriptionPlanId,
): string {
  if (code.discountPercent === 100) {
    return `Listo. Tu plan ${planLabel(targetPlan)} está activo por ${code.durationDays} días sin cargo.`;
  }
  return `Listo. Aplicamos ${code.discountPercent}% off sobre ${planLabel(targetPlan)} por ${code.durationDays} días.`;
}

async function recordRedemption(
  userId: string,
  code: SubscriptionCode,
  targetPlan: SubscriptionPlanId,
): Promise<void> {
  try {
    await addDoc(collection(db, FS_COL.subscriptionRedemptions), {
      userId,
      code: code.code,
      targetPlan,
      discountPercent: code.discountPercent,
      durationDays: code.durationDays,
      appliesTo: code.appliesTo,
      createdAt: serverTimestamp(),
    });
  } catch {
    // No bloqueamos el flujo si el log falla; la subscription quedó persistida.
  }
}

/**
 * Aplica un código promocional al usuario.
 *
 * Pasos:
 *  1. Gate: si el user ya tiene plan pago activo, no se permite canjear.
 *  2. Lookup del doc en t2t_subscription_codes.
 *  3. Validar disponible + no expirado.
 *  4. Transacción atómica que marca `used` (evita doble-canje concurrente).
 *  5. provider.subscribe con discountPercent + durationDaysOverride.
 *  6. recordRedemption + updateUserFields(appliedCouponCode).
 */
export async function applyCodeToUser(
  userId: string,
  rawCode: string,
  opts?: ApplyCodeOptions,
): Promise<CodeApplyResult> {
  const codeKey = normalizeCode(rawCode);
  if (!codeKey) {
    return { ok: false, reason: 'empty', message: 'Ingresá un código.' };
  }

  // 1) Gate de plan pago.
  let user: User | null = null;
  try {
    user = await getUserProfile(userId);
  } catch {
    user = null;
  }
  if (hasActivePaidPlan(user)) {
    const currentPlan = user?.subscriptionPlan ? planLabel(user.subscriptionPlan) : 'tu plan';
    return {
      ok: false,
      reason: 'already_paid',
      message: `Ya tenés ${currentPlan} activo. Los códigos promocionales son sólo para activar tu primer plan.`,
    };
  }

  // 2) Lookup.
  const snapshot = await validateCode(codeKey);
  if (!snapshot) {
    return {
      ok: false,
      reason: 'not_found',
      message: 'El código no es válido o ya no está disponible.',
    };
  }

  // 3) Estado.
  if (snapshot.used) {
    return { ok: false, reason: 'used', message: 'Este código ya fue canjeado.' };
  }
  if (snapshot.expiresAt && snapshot.expiresAt.getTime() <= Date.now()) {
    const fecha = snapshot.expiresAt.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return { ok: false, reason: 'expired', message: `Este código venció el ${fecha}.` };
  }

  const targetPlan = resolveTargetPlan(snapshot, user, opts);

  // 4) Reclamar el código con una transacción (evita doble canje concurrente).
  try {
    const codeRef = doc(db, FS_COL.subscriptionCodes, snapshot.code);
    await runTransaction(db, async (tx) => {
      const fresh = await tx.get(codeRef);
      if (!fresh.exists()) {
        throw new Error('not_found');
      }
      const data = fresh.data() as Record<string, unknown>;
      if (data.used === true) {
        throw new Error('used');
      }
      const expiresAt = toDate(data.expiresAt);
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        throw new Error('expired');
      }
      tx.update(codeRef, {
        used: true,
        usedBy: userId,
        usedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    const reason = (err as Error)?.message as CodeApplyReason;
    if (reason === 'used') {
      return { ok: false, reason: 'used', message: 'Este código ya fue canjeado.' };
    }
    if (reason === 'expired') {
      return { ok: false, reason: 'expired', message: 'Este código ya venció.' };
    }
    if (reason === 'not_found') {
      return {
        ok: false,
        reason: 'not_found',
        message: 'El código no es válido o ya no está disponible.',
      };
    }
    return {
      ok: false,
      reason: 'race',
      message: 'No se pudo reservar el código. Intentá de nuevo.',
    };
  }

  // 5) Activar la subscripción con el descuento + duración.
  const provider = getBillingProvider();
  let subscription: Subscription | undefined;
  try {
    subscription = await provider.subscribe(userId, targetPlan, 'monthly', 'code', {
      couponCode: snapshot.code,
      discountPercent: snapshot.discountPercent,
      durationDaysOverride: snapshot.durationDays,
    });
  } catch {
    // Si el subscribe falla, igual ya marcamos el code como `used`. En Fase 1
    // mock esto no debería pasar; en Fase 2 (pasarela real) el rollback lo
    // maneja el backend. Devolvemos error para que la UI lo refleje.
    return {
      ok: false,
      reason: 'error',
      message: 'No se pudo activar tu plan. Contactanos para que te ayudemos.',
    };
  }

  // 6) Tracking.
  await Promise.all([
    updateUserFields(userId, { appliedCouponCode: snapshot.code }),
    recordRedemption(userId, snapshot, targetPlan),
  ]);

  return {
    ok: true,
    code: snapshot,
    targetPlan,
    durationDays: snapshot.durationDays,
    discountPercent: snapshot.discountPercent,
    subscription,
    message: buildSuccessMessage(snapshot, targetPlan),
  };
}
