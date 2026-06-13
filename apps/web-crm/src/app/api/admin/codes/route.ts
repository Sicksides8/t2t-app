import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../lib/routeError';
import type {
  CodeAppliesTo,
  CreateCodeBody,
  SubscriptionCodeRow,
} from '../../../../types';

const CODE_REGEX = /^[A-Z0-9-]{4,24}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_DURATION_DAYS = 365;
const DEFAULT_DURATION_DAYS = 30;

function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

function generateCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

function mapCodeDoc(id: string, data: Record<string, unknown>): SubscriptionCodeRow {
  return {
    id,
    title: data.title ? String(data.title) : undefined,
    planId: String(data.planId || ''),
    appliesTo: (data.appliesTo as CodeAppliesTo | undefined) ?? undefined,
    discountPercent:
      typeof data.discountPercent === 'number' ? data.discountPercent : undefined,
    durationDays: Number(data.durationDays || 0),
    expiresAt: toIso(data.expiresAt),
    used: Boolean(data.used),
    usedBy: data.usedBy ? String(data.usedBy) : undefined,
    usedAt: toIso(data.usedAt),
    createdAt: toIso(data.createdAt),
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const snapshot = await adminDb.collection(FS_COL.subscriptionCodes).limit(500).get();
    const rows: SubscriptionCodeRow[] = snapshot.docs.map((doc) =>
      mapCodeDoc(doc.id, doc.data()),
    );

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

/**
 * POST /api/admin/codes
 * Crea un cupon en t2t_subscription_codes.
 * Si discountPercent === 100, el codigo entrega acceso GRATIS por durationDays.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = (await request.json().catch(() => ({}))) as Partial<CreateCodeBody>;

    const rawCode = (body.code ?? '').toString().trim().toUpperCase();
    const code = rawCode || generateCode();
    if (!CODE_REGEX.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Codigo invalido: 4-24 caracteres A-Z, 0-9 o guion.' },
        },
        { status: 400 },
      );
    }

    const title = String(body.title ?? '').trim();
    if (!title) {
      return NextResponse.json(
        { success: false, error: { message: 'title es obligatorio' } },
        { status: 400 },
      );
    }
    if (title.length > 120) {
      return NextResponse.json(
        { success: false, error: { message: 'title no puede superar 120 caracteres' } },
        { status: 400 },
      );
    }

    const discountPercent = Number(body.discountPercent);
    if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return NextResponse.json(
        { success: false, error: { message: 'discountPercent debe ser entero entre 1 y 100' } },
        { status: 400 },
      );
    }

    const appliesTo = body.appliesTo as CodeAppliesTo | undefined;
    if (appliesTo !== 'pro' && appliesTo !== 'elite' && appliesTo !== 'any_paid') {
      return NextResponse.json(
        { success: false, error: { message: 'appliesTo debe ser pro, elite o any_paid' } },
        { status: 400 },
      );
    }

    let expiresAtTs: Timestamp | null = null;
    if (body.expiresAt) {
      const ms = Date.parse(String(body.expiresAt));
      if (!Number.isFinite(ms)) {
        return NextResponse.json(
          { success: false, error: { message: 'expiresAt debe ser una fecha valida' } },
          { status: 400 },
        );
      }
      if (ms <= Date.now()) {
        return NextResponse.json(
          { success: false, error: { message: 'expiresAt debe ser una fecha futura' } },
          { status: 400 },
        );
      }
      expiresAtTs = Timestamp.fromMillis(ms);
    }

    let durationDays = Number.isFinite(Number(body.durationDays))
      ? Number(body.durationDays)
      : DEFAULT_DURATION_DAYS;
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > MAX_DURATION_DAYS) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `durationDays debe ser entero entre 1 y ${MAX_DURATION_DAYS}` },
        },
        { status: 400 },
      );
    }
    if (discountPercent === 100 && !body.durationDays) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Con 100% de descuento el codigo entrega acceso GRATIS y durationDays es obligatorio',
          },
        },
        { status: 400 },
      );
    }

    const codeRef = adminDb.collection(FS_COL.subscriptionCodes).doc(code);
    const existing = await codeRef.get();
    if (existing.exists) {
      return NextResponse.json(
        { success: false, error: { message: 'code_already_exists' } },
        { status: 409 },
      );
    }

    const planIdToStore = appliesTo === 'any_paid' ? 'any_paid' : appliesTo;

    const docPayload = {
      title,
      discountPercent,
      appliesTo,
      planId: planIdToStore,
      durationDays,
      expiresAt: expiresAtTs,
      used: false,
      usedBy: null,
      usedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: admin.uid,
    };

    await codeRef.set(docPayload);

    const created = await codeRef.get();
    const row = mapCodeDoc(created.id, created.data() ?? {});
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
