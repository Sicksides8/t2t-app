import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../../lib/authHelper';
import { handleRouteError } from '../../../../../../../lib/routeError';
import { adjustUserCoins } from '../../../../../../../lib/coinsServer';
import type { GrantCoinsBody } from '../../../../../../../types';

type RouteContext = { params: Promise<{ uid: string }> };

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

    const body = (await request.json().catch(() => ({}))) as Partial<GrantCoinsBody>;
    const amount = Number(body.amount);
    const reason = String(body.reason || '').trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: { message: 'amount debe ser un numero positivo' } },
        { status: 400 },
      );
    }
    if (!reason) {
      return NextResponse.json(
        { success: false, error: { message: 'reason es obligatorio' } },
        { status: 400 },
      );
    }

    const result = await adjustUserCoins({
      userId: uid,
      delta: amount,
      reason,
      adminUid: admin.uid,
      adminEmail: admin.email,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'user_not_found') {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 },
      );
    }
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
