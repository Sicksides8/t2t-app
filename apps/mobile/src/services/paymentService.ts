/**
 * paymentService — historial de pagos.
 *
 * Hoy lee de Firestore (`t2t_payments/`) los pagos creados por
 * mockBillingProvider. Si Firestore no devuelve nada o falla, hacemos
 * fallback al seed local para que la pantalla de "Mi suscripción" no quede
 * vacía en cuentas recién creadas / en dev sin datos.
 *
 * TODO MERCADOPAGO: cuando se conecte la pasarela real, los pagos los
 * crea el webhook del backend (no la app). La lectura desde Firestore se
 * mantiene igual; solo cambia quién escribe.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from './firebase';
import { seedPayments } from '../data/payments';
import type { Payment } from '../types';

function mapPayment(id: string, data: any): Payment | null {
  if (!data) return null;
  const paidAt: Date | undefined = data.paidAt?.toDate?.();
  if (!paidAt) return null;
  return {
    id: data.id || id,
    userId: data.userId || '',
    plan: (data.plan || 'free') as Payment['plan'],
    planLabel: data.planLabel || '',
    amount: typeof data.amount === 'number' ? data.amount : 0,
    currency: data.currency || 'USD',
    method: (data.method || 'Mock') as Payment['method'],
    txId: data.txId || `#${id}`,
    paidAt,
    status: (data.status || 'paid') as Payment['status'],
    cycle: data.cycle,
    couponCode: typeof data.couponCode === 'string' ? data.couponCode : undefined,
  };
}

export async function getPaymentHistory(userId: string): Promise<Payment[]> {
  try {
    const q = query(
      collection(db, FS_COL.payments),
      where('userId', '==', userId),
      orderBy('paidAt', 'desc'),
    );
    const snap = await getDocs(q);
    const items = snap.docs
      .map((d) => mapPayment(d.id, d.data()))
      .filter((p): p is Payment => p !== null);
    if (items.length > 0) return items;
  } catch {
    // Firestore puede fallar por red, índice faltante o seguridad — caemos al seed.
  }
  // Fallback al seed para cuentas nuevas/dev sin pagos cargados.
  return seedPayments.map((p) => ({ ...p, userId }));
}

export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  try {
    const snap = await getDoc(doc(db, FS_COL.payments, paymentId));
    if (snap.exists()) {
      const mapped = mapPayment(snap.id, snap.data());
      if (mapped) return mapped;
    }
  } catch {
    // ignoramos y caemos al seed
  }
  const found = seedPayments.find((p) => p.id === paymentId);
  return found ? { ...found } : null;
}
