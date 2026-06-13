import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../../lib/authHelper';
import { FS_COL } from '../../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../../lib/routeError';
import type { UpdateRoleBody } from '../../../../../../types';

type RouteContext = { params: Promise<{ uid: string }> };

/**
 * PATCH /api/admin/users/[uid]/role
 * Cambia el rol del usuario (admin <-> student).
 * Actualiza custom claims y revoca refresh tokens para forzar el refresh del rol.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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
        { success: false, error: { message: 'No podes cambiar tu propio rol' } },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Partial<UpdateRoleBody>;
    const role = body.role;
    if (role !== 'admin' && role !== 'student') {
      return NextResponse.json(
        { success: false, error: { message: 'role debe ser admin o student' } },
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

    await adminAuth.setCustomUserClaims(uid, { admin: role === 'admin' });
    await adminAuth.revokeRefreshTokens(uid);
    await userRef.set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    return NextResponse.json({ success: true, data: { uid, role } });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
