/**
 * Mutex global para operaciones IAP — evita compras concurrentes, restores
 * solapados y doble verificación del mismo token/transactionId.
 */
import type { Subscription } from '../../types';

export type PendingPurchase = {
  userId: string;
  productId: string;
  platform: 'google' | 'apple';
  resolve: (sub: Subscription) => void;
  reject: (err: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  couponCode?: string;
};

let pending: PendingPurchase | null = null;
let exclusiveChain: Promise<unknown> = Promise.resolve();
const verifyInflight = new Map<string, Promise<Subscription>>();

export function isPurchaseInFlight(): boolean {
  return pending !== null;
}

export function getPendingPurchase(): PendingPurchase | null {
  return pending;
}

export function assertNoPendingPurchase(): void {
  if (pending) {
    throw new Error('Ya hay una compra en curso. Esperá a que termine.');
  }
}

export function registerPending(
  params: Omit<PendingPurchase, 'resolve' | 'reject' | 'timeoutId'>,
  timeoutMs: number,
): Promise<Subscription> {
  assertNoPendingPurchase();
  return new Promise<Subscription>((resolve, reject) => {
    pending = {
      ...params,
      resolve,
      reject,
      timeoutId: setTimeout(() => {
        failPending(new Error('La compra expiró por timeout. Intentá de nuevo.'));
      }, timeoutMs),
    };
  });
}

export function completePending(sub: Subscription): void {
  if (!pending) return;
  const p = pending;
  clearPending();
  p.resolve(sub);
}

export function failPending(err: Error): void {
  if (!pending) return;
  const p = pending;
  clearPending();
  p.reject(err);
}

function clearPending(): void {
  if (pending) {
    clearTimeout(pending.timeoutId);
    pending = null;
  }
}

/** Serializa restore + launchPurchase para que no compitan por el listener. */
export async function runBillingExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const next = exclusiveChain.then(fn, fn);
  exclusiveChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

/** Dedupe verify concurrente del mismo receipt/token (race del listener). */
export function verifyPurchaseOnce(
  dedupeKey: string,
  verifyFn: () => Promise<Subscription>,
): Promise<Subscription> {
  const inflight = verifyInflight.get(dedupeKey);
  if (inflight) return inflight;
  const promise = verifyFn().finally(() => {
    verifyInflight.delete(dedupeKey);
  });
  verifyInflight.set(dedupeKey, promise);
  return promise;
}
