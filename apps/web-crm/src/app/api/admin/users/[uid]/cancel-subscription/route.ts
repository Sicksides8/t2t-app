import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../../lib/authHelper';
import { FS_COL } from '../../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../../lib/routeError';
import type { CancelSubscriptionBody } from '../../../../../../types';

type RouteContext = { params: Promise<{ uid: string }> };

/**
 * POST /api/admin/users/[uid]/cancel-subscription
 * Marca la suscripcion como cancelada en t2t_subscriptions y refleja en t2t_users.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { uid } = await context.params;
    if (!uid) {
      return NextResponse.json(
        { success: false, error: { message: 'uid requerido' } },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Partial<CancelSubscriptionBody>;
    const reason = String(body.reason || '').trim();

    const subRef = adminDb.collection(FS_COL.subscriptions).doc(uid);
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      return NextResponse.json(
        { success: false, error: { message: 'El usuario no tiene una suscripcion activa' } },
        { status: 404 },
      );
    }

    const subData = subSnap.data() || {};
    if (subData.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: { message: 'La suscripcion ya estaba cancelada' } },
        { status: 400 },
      );
    }

    const now = FieldValue.serverTimestamp();
    await subRef.set(
      {
        status: 'cancelled',
        cancelledAt: now,
        cancelReason: reason || null,
        cancelledBy: admin.uid,
        updatedAt: now,
      },
      { merge: true },
    );

    await adminDb
      .collection(FS_COL.users)
      .doc(uid)
      .set({ subscriptionStatus: 'cancelled', updatedAt: now }, { merge: true });

    return NextResponse.json({ success: true, data: { uid } });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
