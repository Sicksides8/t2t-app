import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';
import { FS_COL } from './firestoreCollections';
import type { CoinTxRow, CoinTxType } from '../types';
import { toIso } from './paymentsServer';

const ALLOWED_TYPES: CoinTxType[] = ['earned', 'spent', 'admin_adjust'];

function normalizeType(raw: unknown): CoinTxType {
  const s = String(raw || 'earned').toLowerCase();
  return (ALLOWED_TYPES as string[]).includes(s) ? (s as CoinTxType) : 'earned';
}

export function mapCoinTxDoc(id: string, data: Record<string, unknown>): CoinTxRow {
  return {
    id,
    userId: String(data.userId || ''),
    amount: typeof data.amount === 'number' ? data.amount : Number(data.amount || 0),
    type: normalizeType(data.type),
    reason: String(data.reason || ''),
    createdAt: toIso(data.createdAt),
    adminUid: data.adminUid ? String(data.adminUid) : undefined,
    adminEmail: data.adminEmail ? String(data.adminEmail) : undefined,
  };
}

export type AdjustResult = {
  txId: string;
  newBalance: number;
  delta: number;
};

/**
 * Ajusta de manera atomica e idempotente el balance de coins de un usuario.
 *
 * - Usa runTransaction + FieldValue.increment(delta) (mismo patron que la app movil
 *   en `firestoreAddCoins` de gamificationService.ts) para evitar races.
 * - Persiste tx en `t2t_coins_transactions/{uid}_{dedupeKey}` con `type='admin_adjust'`,
 *   `adminUid` y `adminEmail` para trazabilidad.
 * - Si delta es negativo y dejaria el balance debajo de 0, falla con `Error('insufficient_balance')`.
 *
 * Devuelve `{ txId, newBalance, delta }`.
 */
export async function adjustUserCoins(params: {
  userId: string;
  delta: number;
  reason: string;
  adminUid: string;
  adminEmail: string;
  dedupeKey?: string;
}): Promise<AdjustResult> {
  const { userId, delta, reason, adminUid, adminEmail } = params;
  const dedupeKey =
    params.dedupeKey ||
    `admin_${adminUid}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const txDocId = `${userId}_${dedupeKey}`;

  const userRef = adminDb.collection(FS_COL.users).doc(userId);
  const txRef = adminDb.collection(FS_COL.coinsTransactions).doc(txDocId);

  return adminDb.runTransaction(async (tx) => {
    const [userSnap, txSnap] = await Promise.all([tx.get(userRef), tx.get(txRef)]);
    if (!userSnap.exists) {
      throw new Error('user_not_found');
    }
    if (txSnap.exists) {
      const data = txSnap.data() as Record<string, unknown>;
      const current = Number((userSnap.data() as Record<string, unknown>)?.coins ?? 0);
      return {
        txId: txDocId,
        newBalance: current,
        delta: typeof data.amount === 'number' ? data.amount : delta,
      };
    }

    const currentCoins = Number((userSnap.data() as Record<string, unknown>)?.coins ?? 0);
    const newBalance = currentCoins + delta;
    if (newBalance < 0) {
      throw new Error('insufficient_balance');
    }

    tx.set(
      userRef,
      { coins: FieldValue.increment(delta), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    tx.set(txRef, {
      userId,
      amount: delta,
      type: 'admin_adjust',
      reason,
      adminUid,
      adminEmail,
      dedupeKey,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { txId: txDocId, newBalance, delta };
  });
}

export { FieldValue, Timestamp };
