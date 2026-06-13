import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../../lib/authHelper';
import { FS_COL } from '../../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../../lib/routeError';
import type { SuspendUserBody } from '../../../../../../types';

type RouteContext = { params: Promise<{ uid: string }> };

/**
 * POST /api/admin/users/[uid]/suspend
 * Suspende o reactiva el acceso del usuario en Firebase Auth.
 * Al suspender, revoca refresh tokens para invalidar sesiones activas.
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
    if (uid === admin.uid) {
      return NextResponse.json(
        { success: false, error: { message: 'No podes suspender tu propia cuenta' } },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Partial<SuspendUserBody>;
    if (typeof body.disabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: { message: 'disabled debe ser true o false' } },
        { status: 400 },
      );
    }

    const disabled = body.disabled;

    try {
      await adminAuth.updateUser(uid, { disabled });
      if (disabled) await adminAuth.revokeRefreshTokens(uid);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/user-not-found') throw err;
    }

    await adminDb
      .collection(FS_COL.users)
      .doc(uid)
      .set({ disabled, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    return NextResponse.json({ success: true, data: { uid, disabled } });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
