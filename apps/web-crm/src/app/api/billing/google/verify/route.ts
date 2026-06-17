/**
 * POST /api/billing/google/verify
 *
 * Llamado por la app movil (googlePlayBillingProvider) inmediatamente
 * despues de un purchaseUpdatedListener. Valida el purchaseToken contra
 * Google Play Developer API y escribe t2t_subscriptions / t2t_payments /
 * espejo en t2t_users via syncSubscriptionFromPlay.
 *
 * Body: { userId, productId, purchaseToken, packageName?, source? }
 * Auth: Bearer <Firebase ID token> (requireUser).
 *
 * El userId del body DEBE coincidir con el uid del token — esto evita
 * que un cliente comprometido se atribuya compras ajenas.
 */
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '../../../../../lib/authHelper';
import { handleRouteError } from '../../../../../lib/routeError';
import { syncSubscriptionFromPlay } from '../../../../../lib/googlePlaySync';

type VerifyBody = {
  userId?: string;
  productId?: string;
  purchaseToken?: string;
  packageName?: string;
  source?: string;
  couponCode?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const body = (await request.json().catch(() => ({}))) as VerifyBody;

    const userId = String(body.userId || '').trim();
    const productId = String(body.productId || '').trim();
    const purchaseToken = String(body.purchaseToken || '').trim();

    if (!userId || !productId || !purchaseToken) {
      return NextResponse.json(
        { success: false, error: { message: 'userId, productId y purchaseToken son obligatorios' } },
        { status: 400 },
      );
    }
    if (userId !== auth.uid) {
      return NextResponse.json(
        { success: false, error: { message: 'userId del body no coincide con el token de Firebase' } },
        { status: 403 },
      );
    }

    const result = await syncSubscriptionFromPlay({
      purchaseToken,
      packageName: body.packageName,
      explicitUserId: userId,
      sourceEvent: 'verify',
    });

    if (result.productId !== productId) {
      // El cliente reporto un SKU distinto al que Google nos devolvio.
      // No falla: el SKU canonico es el de Google.
      console.warn(
        `[google-verify] productId mismatch: client=${productId} google=${result.productId}`,
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: result.subscription,
        orderId: result.orderId,
        acknowledged: result.acknowledged,
      },
    });
  } catch (error) {
    console.error('[google-verify] error:', error);
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
