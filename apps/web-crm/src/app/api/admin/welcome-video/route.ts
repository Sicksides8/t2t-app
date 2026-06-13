import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/authHelper';
import { adminDb } from '../../../../lib/firebase-admin';
import { deleteObject, isR2Configured, keyFromPublicUrl } from '../../../../lib/r2';
import { handleRouteError } from '../../../../lib/routeError';

/**
 * Video de bienvenida del onboarding (admin panel top-level).
 *
 * Persistencia: t2t_config/app  →  campo `welcomeVideoUrl` (string | null).
 * Lectura desde mobile: directa por Firestore client (rules permiten read
 * publico de t2t_config). Escritura: solo via este endpoint con admin SDK.
 */

const CONFIG_COLLECTION = 't2t_config';
const CONFIG_DOC = 'app';

type ConfigDoc = {
  welcomeVideoUrl?: string | null;
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const snap = await adminDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
    const data = (snap.data() as ConfigDoc | undefined) || {};
    const url = typeof data.welcomeVideoUrl === 'string' ? data.welcomeVideoUrl : null;
    return NextResponse.json({ success: true, data: { welcomeVideoUrl: url } });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = (await request.json().catch(() => ({}))) as { videoUrl?: unknown };
    const raw = body.videoUrl;
    let next: string | null;
    if (raw === null || raw === undefined || raw === '') {
      next = null;
    } else if (typeof raw === 'string' && raw.startsWith('https://')) {
      next = raw;
    } else {
      return NextResponse.json(
        { success: false, error: { message: 'videoUrl debe ser https o null' } },
        { status: 400 },
      );
    }

    const ref = adminDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC);
    const prevSnap = await ref.get();
    const prevUrl =
      typeof (prevSnap.data() as ConfigDoc | undefined)?.welcomeVideoUrl === 'string'
        ? ((prevSnap.data() as ConfigDoc).welcomeVideoUrl as string)
        : null;

    await ref.set(
      { welcomeVideoUrl: next, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

    // Best-effort cleanup del objeto anterior en R2 (si era nuestro y cambio).
    if (prevUrl && prevUrl !== next && isR2Configured()) {
      const key = keyFromPublicUrl(prevUrl);
      if (key) {
        try {
          await deleteObject(key);
        } catch (cleanupErr) {
          console.warn('[welcome-video] R2 cleanup fallo', cleanupErr);
        }
      }
    }

    return NextResponse.json({ success: true, data: { welcomeVideoUrl: next } });
  } catch (err) {
    return handleRouteError(err);
  }
}
