import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../lib/authHelper';
import { FS_COL } from '../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../lib/routeError';
import { mapPaymentDoc, toIso } from '../../../../../lib/paymentsServer';
import { mapCoinTxDoc } from '../../../../../lib/coinsServer';
import type {
  AdminUserRow,
  CoinTxRow,
  PaymentRow,
  SubscriptionSummary,
  UserDetail,
} from '../../../../../types';

type RouteContext = { params: Promise<{ uid: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    const { uid } = await context.params;
    if (!uid) {
      return NextResponse.json(
        { success: false, error: { message: 'uid requerido' } },
        { status: 400 },
      );
    }

    const userRef = adminDb.collection(FS_COL.users).doc(uid);
    const subRef = adminDb.collection(FS_COL.subscriptions).doc(uid);

    const [userSnap, subSnap, paymentsSnap, coinsSnap] = await Promise.all([
      userRef.get(),
      subRef.get(),
      adminDb
        .collection(FS_COL.payments)
        .where('userId', '==', uid)
        .limit(200)
        .get()
        .catch(() => null),
      adminDb
        .collection(FS_COL.coinsTransactions)
        .where('userId', '==', uid)
        .limit(500)
        .get()
        .catch(() => null),
    ]);

    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 },
      );
    }

    const userData = userSnap.data() as Record<string, unknown>;

    const user: AdminUserRow = {
      id: uid,
      displayName: String(userData.displayName || 'Sin nombre'),
      email: String(userData.email || ''),
      role: userData.role === 'admin' ? 'admin' : 'student',
      selectedPlan: userData.selectedPlan ? String(userData.selectedPlan) : undefined,
      subscriptionId: userData.subscriptionId ? String(userData.subscriptionId) : undefined,
      subscriptionPlan: userData.subscriptionPlan ? String(userData.subscriptionPlan) : undefined,
      subscriptionStatus: userData.subscriptionStatus
        ? String(userData.subscriptionStatus)
        : undefined,
      onboardingCompleted: Boolean(userData.onboardingCompleted),
      coins: typeof userData.coins === 'number' ? userData.coins : 0,
      createdAt: toIso(userData.createdAt),
      disabled: Boolean(userData.disabled),
    };

    let subscription: SubscriptionSummary | null = null;
    if (subSnap.exists) {
      const s = subSnap.data() as Record<string, unknown>;
      subscription = {
        planId: String(s.planId || 'free'),
        status: String(s.status || 'free'),
        source: String(s.source || 'unknown'),
        cycle: String(s.cycle || 'monthly'),
        startDate: toIso(s.startDate),
        endDate: toIso(s.endDate),
        couponCode: s.couponCode ? String(s.couponCode) : undefined,
        discountPercent:
          typeof s.discountPercent === 'number' ? s.discountPercent : undefined,
      };
    }

    const payments: PaymentRow[] = (paymentsSnap?.docs ?? [])
      .map((doc) => mapPaymentDoc(doc.id, doc.data()))
      .sort((a, b) => {
        const ta = a.paidAt ? Date.parse(a.paidAt) : 0;
        const tb = b.paidAt ? Date.parse(b.paidAt) : 0;
        return tb - ta;
      });

    const coinsHistory: CoinTxRow[] = (coinsSnap?.docs ?? [])
      .map((doc) => mapCoinTxDoc(doc.id, doc.data()))
      .sort((a, b) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
        return tb - ta;
      })
      .slice(0, 100);

    // totalSpent y lastPaymentAt agregados de payments
    const paidOnly = payments.filter((p) => p.status === 'paid');
    user.totalSpent = Math.round(paidOnly.reduce((s, p) => s + p.amount, 0) * 100) / 100;
    user.lastPaymentAt = paidOnly[0]?.paidAt ?? null;

    const detail: UserDetail = {
      user,
      subscription,
      payments,
      coinsBalance: user.coins ?? 0,
      coinsHistory,
    };

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * DELETE /api/admin/users/[uid]
 * Borra el doc en t2t_users y t2t_subscriptions, y la cuenta en Firebase Auth.
 * Conserva pagos y movimientos de coins historicos para reportes.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { uid } = await context.params;
    if (!uid) {
      return NextResponse.json(
        { success: false, error: { message: 'uid requerido' } },
        { status: 400 },
      );
    }
    if (uid === admin.uid) {
      return NextResponse.json(
        { success: false, error: { message: 'No podes eliminar tu propia cuenta' } },
        { status: 400 },
      );
    }

    const userRef = adminDb.collection(FS_COL.users).doc(uid);
    const subRef = adminDb.collection(FS_COL.subscriptions).doc(uid);

    await Promise.all([
      userRef.delete().catch(() => null),
      subRef.delete().catch(() => null),
    ]);

    try {
      await adminAuth.deleteUser(uid);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/user-not-found') throw err;
    }

    return NextResponse.json({ success: true, data: { uid } });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
