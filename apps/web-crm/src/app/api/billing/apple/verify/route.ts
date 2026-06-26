/**
 * POST /api/billing/apple/verify
 *
 * Valida una compra de App Store enviada desde appleIAPBillingProvider.
 * Body: { userId, productId, transactionId?, purchaseToken?, originalTransactionId? }
 */
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '../../../../../lib/authHelper';
import { handleRouteError } from '../../../../../lib/routeError';
import { syncSubscriptionFromApple } from '../../../../../lib/appleSync';

type VerifyBody = {
  userId?: string;
  productId?: string;
  transactionId?: string;
  purchaseToken?: string;
  originalTransactionId?: string;
  couponCode?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const body = (await request.json().catch(() => ({}))) as VerifyBody;

    const userId = String(body.userId || '').trim();
    const productId = String(body.productId || '').trim();

    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, error: { message: 'userId y productId son obligatorios' } },
        { status: 400 },
      );
    }
    if (userId !== auth.uid) {
      return NextResponse.json(
        { success: false, error: { message: 'userId del body no coincide con el token de Firebase' } },
        { status: 403 },
      );
    }

    const result = await syncSubscriptionFromApple({
      userId,
      productId,
      transactionId: body.transactionId,
      purchaseToken: body.purchaseToken,
      originalTransactionId: body.originalTransactionId,
    });

    return NextResponse.json({
      success: true,
      data: {
        subscription: result.subscription,
        orderId: result.orderId,
      },
    });
  } catch (error) {
    console.error('[apple-verify] error:', error);
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
