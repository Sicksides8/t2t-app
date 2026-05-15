import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../lib/routeError';
import type { SubscriptionCodeRow } from '../../../../types';

function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const snapshot = await adminDb.collection(FS_COL.subscriptionCodes).limit(250).get();
    const rows: SubscriptionCodeRow[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        planId: String(data.planId || ''),
        durationDays: Number(data.durationDays || 0),
        used: Boolean(data.used),
        usedBy: data.usedBy ? String(data.usedBy) : undefined,
        usedAt: toIso(data.usedAt),
        createdAt: toIso(data.createdAt),
      };
    });

    rows.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return handleRouteError(error);
  }
}
