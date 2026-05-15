import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../lib/routeError';
import type { AdminUserRow } from '../../../../types';

function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const snapshot = await adminDb.collection(FS_COL.users).limit(250).get();
    const rows: AdminUserRow[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        displayName: String(data.displayName || 'Sin nombre'),
        email: String(data.email || ''),
        role: data.role === 'admin' ? 'admin' : 'student',
        selectedPlan: data.selectedPlan ? String(data.selectedPlan) : undefined,
        subscriptionId: data.subscriptionId ? String(data.subscriptionId) : undefined,
        onboardingCompleted: Boolean(data.onboardingCompleted),
        coins: typeof data.coins === 'number' ? data.coins : undefined,
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
