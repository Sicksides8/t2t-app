import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../lib/routeError';
import { mapPaymentDoc, toIso } from '../../../../lib/paymentsServer';
import type { AdminUserRow } from '../../../../types';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [usersSnap, paymentsSnap] = await Promise.all([
      adminDb.collection(FS_COL.users).limit(500).get(),
      adminDb.collection(FS_COL.payments).limit(5000).get(),
    ]);

    // Agregar pagos por userId en 1 sola pasada (evita N+1).
    type PayAgg = { total: number; lastPaidAt: string | null };
    const payAgg = new Map<string, PayAgg>();
    for (const doc of paymentsSnap.docs) {
      const p = mapPaymentDoc(doc.id, doc.data());
      if (!p.userId || p.status !== 'paid') continue;
      const agg = payAgg.get(p.userId) ?? { total: 0, lastPaidAt: null };
      agg.total += p.amount;
      if (p.paidAt && (!agg.lastPaidAt || p.paidAt > agg.lastPaidAt)) {
        agg.lastPaidAt = p.paidAt;
      }
      payAgg.set(p.userId, agg);
    }

    const rows: AdminUserRow[] = usersSnap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const agg = payAgg.get(doc.id);
      return {
        id: doc.id,
        displayName: String(data.displayName || 'Sin nombre'),
        email: String(data.email || ''),
        role: data.role === 'admin' ? 'admin' : 'student',
        selectedPlan: data.selectedPlan ? String(data.selectedPlan) : undefined,
        subscriptionId: data.subscriptionId ? String(data.subscriptionId) : undefined,
        subscriptionPlan: data.subscriptionPlan ? String(data.subscriptionPlan) : undefined,
        subscriptionStatus: data.subscriptionStatus ? String(data.subscriptionStatus) : undefined,
        onboardingCompleted: Boolean(data.onboardingCompleted),
        coins: typeof data.coins === 'number' ? data.coins : undefined,
        totalSpent: agg ? Math.round(agg.total * 100) / 100 : 0,
        lastPaymentAt: agg?.lastPaidAt ?? null,
        createdAt: toIso(data.createdAt),
      };
    });

    rows.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
