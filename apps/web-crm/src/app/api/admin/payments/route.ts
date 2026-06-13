import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../lib/routeError';
import { mapPaymentDoc } from '../../../../lib/paymentsServer';
import type { PaymentRow } from '../../../../types';

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? new Date(ts) : null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const from = parseDateParam(url.searchParams.get('from'));
    const to = parseDateParam(url.searchParams.get('to'));
    const plan = url.searchParams.get('plan');
    const method = url.searchParams.get('method');
    const status = url.searchParams.get('status');
    const limit = Math.min(2000, Number(url.searchParams.get('limit') || 500));

    // Filtramos en memoria para evitar pedir indices compuestos a Firestore.
    // Si la coleccion crece >10k filas conviene mover from/to al query nativo.
    let query = adminDb
      .collection(FS_COL.payments)
      .orderBy('paidAt', 'desc')
      .limit(limit);

    if (from) {
      query = query.where('paidAt', '>=', Timestamp.fromDate(from));
    }
    if (to) {
      query = query.where('paidAt', '<=', Timestamp.fromDate(to));
    }

    let snapshot;
    try {
      snapshot = await query.get();
    } catch {
      // Fallback: orderBy puede fallar si algun doc no tiene paidAt; leer todo y ordenar en memoria.
      snapshot = await adminDb.collection(FS_COL.payments).limit(limit).get();
    }

    const rows: PaymentRow[] = snapshot.docs
      .map((doc) => mapPaymentDoc(doc.id, doc.data()))
      .filter((row) => {
        if (plan && row.plan !== plan) return false;
        if (method && row.method !== method) return false;
        if (status && row.status !== status) return false;
        return true;
      });

    rows.sort((a, b) => {
      const ta = a.paidAt ? Date.parse(a.paidAt) : 0;
      const tb = b.paidAt ? Date.parse(b.paidAt) : 0;
      return tb - ta;
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return handleRouteError(error);
  }
}
