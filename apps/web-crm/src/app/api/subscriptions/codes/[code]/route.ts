import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../../../../../lib/firebase-admin';
import { requireUser } from '../../../../../lib/authHelper';
import { FS_COL } from '../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../lib/routeError';
import type { CodeAppliesTo } from '../../../../../types';

/**
 * GET /api/subscriptions/codes/[code]
 *
 * Endpoint READ-ONLY para preview de un codigo promocional desde la mobile.
 * Devuelve metadata + status computado sin marcarlo como usado.
 *
 * En Fase 1 la mobile valida/canjea directo contra Firestore (single-source
 * of truth). Este endpoint queda preparado para Fase 2: cuando entre la
 * pasarela real (MercadoPago / IAP), el canje DEBE pasar primero por aca
 * server-side antes de generar la preference para evitar fraude.
 */

type CodeStatus = 'available' | 'used' | 'expired';

type CodePreview = {
  id: string;
  title?: string;
  discountPercent: number;
  appliesTo: CodeAppliesTo;
  durationDays: number;
  expiresAt: string | null;
  status: CodeStatus;
};

function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

function computeStatus(data: Record<string, unknown>): CodeStatus {
  if (data.used === true) return 'used';
  const expiresIso = toIso(data.expiresAt);
  if (expiresIso && Date.parse(expiresIso) <= Date.now()) return 'expired';
  return 'available';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  try {
    await requireUser(request);
    const { code: rawCode } = await context.params;
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { success: false, error: { message: 'Codigo requerido' } },
        { status: 400 },
      );
    }

    const snapshot = await adminDb.collection(FS_COL.subscriptionCodes).doc(code).get();
    if (!snapshot.exists) {
      return NextResponse.json(
        { success: false, error: { message: 'Codigo no encontrado' } },
        { status: 404 },
      );
    }

    const data = snapshot.data() ?? {};
    const preview: CodePreview = {
      id: snapshot.id,
      title: data.title ? String(data.title) : undefined,
      discountPercent: Number(data.discountPercent) || 0,
      appliesTo: (data.appliesTo as CodeAppliesTo) ?? 'any_paid',
      durationDays: Number(data.durationDays) || 0,
      expiresAt: toIso(data.expiresAt),
      status: computeStatus(data),
    };

    return NextResponse.json({ success: true, data: preview });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
