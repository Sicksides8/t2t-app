import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../../lib/authHelper';
import { FS_COL } from '../../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../../lib/routeError';
import { getCanonicalPlan } from '../../../../../../lib/plans';
import type { GrantPlanBody } from '../../../../../../types';

type RouteContext = { params: Promise<{ uid: string }> };

const MAX_DURATION_DAYS = 365 * 5;

/**
 * POST /api/admin/users/[uid]/grant-plan
 * Activa un plan PRO o ELITE para el usuario por durationDays, sin pasar por checkout.
 * Upserta el doc en t2t_subscriptions/{uid} y sincroniza t2t_users.
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

    const body = (await request.json().catch(() => ({}))) as Partial<GrantPlanBody>;
    const planId = body.planId;
    const cycle = body.cycle;
    const durationDays = Number(body.durationDays);
    const reason = String(body.reason || '').trim();

    if (planId !== 'pro' && planId !== 'elite') {
      return NextResponse.json(
        { success: false, error: { message: 'planId debe ser pro o elite' } },
        { status: 400 },
      );
    }
    if (cycle !== 'monthly' && cycle !== 'yearly') {
      return NextResponse.json(
        { success: false, error: { message: 'cycle debe ser monthly o yearly' } },
        { status: 400 },
      );
    }
    if (!Number.isInteger(durationDays) || durationDays <= 0 || durationDays > MAX_DURATION_DAYS) {
      return NextResponse.json(
        { success: false, error: { message: `durationDays debe ser entero entre 1 y ${MAX_DURATION_DAYS}` } },
        { status: 400 },
      );
    }
    if (!reason) {
      return NextResponse.json(
        { success: false, error: { message: 'reason es obligatorio para auditoria' } },
        { status: 400 },
      );
    }
    if (!getCanonicalPlan(planId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Plan no reconocido en el catalogo canonico' } },
        { status: 400 },
      );
    }

    const userRef = adminDb.collection(FS_COL.users).doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 },
      );
    }

    const startDate = Timestamp.now();
    const endMs = startDate.toMillis() + durationDays * 24 * 60 * 60 * 1000;
    const endDate = Timestamp.fromMillis(endMs);

    const subRef = adminDb.collection(FS_COL.subscriptions).doc(uid);
    await subRef.set(
      {
        userId: uid,
        planId,
        status: 'active',
        source: 'admin',
        cycle,
        startDate,
        endDate,
        cancelledAt: null,
        cancelReason: null,
        grantedBy: admin.uid,
        grantedReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await userRef.set(
      {
        subscriptionId: uid,
        subscriptionPlan: planId,
        subscriptionStatus: 'active',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({
      success: true,
      data: {
        uid,
        planId,
        cycle,
        durationDays,
        startDate: startDate.toDate().toISOString(),
        endDate: endDate.toDate().toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
