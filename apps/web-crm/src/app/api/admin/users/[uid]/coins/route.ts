import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../../lib/authHelper';
import { FS_COL } from '../../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../../lib/routeError';
import { mapCoinTxDoc } from '../../../../../../lib/coinsServer';
import type { CoinsHistoryResponse, CoinTxRow } from '../../../../../../types';

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

    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') || 100)));
    const cursor = url.searchParams.get('cursor');

    // No usamos orderBy('createdAt') porque puede requerir indice compuesto con where('userId').
    // Leemos todas las txs del usuario (limitado a 500) y ordenamos en memoria.
    let query = adminDb
      .collection(FS_COL.coinsTransactions)
      .where('userId', '==', uid)
      .limit(limit + 1);

    if (cursor) {
      // Cursor formato: docId; usamos startAfter sobre el doc para paginar.
      const cursorSnap = await adminDb.collection(FS_COL.coinsTransactions).doc(cursor).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const snap = await query.get();
    const items: CoinTxRow[] = snap.docs.map((doc) => mapCoinTxDoc(doc.id, doc.data()));

    items.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

    const userSnap = await adminDb.collection(FS_COL.users).doc(uid).get();
    const balance = userSnap.exists
      ? Number((userSnap.data() as Record<string, unknown>)?.coins ?? 0)
      : 0;

    const response: CoinsHistoryResponse = {
      items: page,
      nextCursor,
      balance,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
