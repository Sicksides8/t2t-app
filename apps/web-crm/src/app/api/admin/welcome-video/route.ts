import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/authHelper';
import { adminDb } from '../../../../lib/firebase-admin';
import { sanitizeSubtitles } from '../../../../lib/courseAdminServer';
import { deleteObject, isR2Configured, keyFromPublicUrl } from '../../../../lib/r2';
import { handleRouteError } from '../../../../lib/routeError';
import type { SubtitleTrack } from '../../../../types';

/**
 * Video de bienvenida del onboarding (admin panel top-level).
 *
 * Persistencia: t2t_config/app  →  campos `welcomeVideoUrl` y
 * `welcomeVideoSubtitles`. Lectura desde mobile: directa por Firestore
 * client (rules permiten read publico de t2t_config). Escritura: solo
 * via este endpoint con admin SDK.
 */

const CONFIG_COLLECTION = 't2t_config';
const CONFIG_DOC = 'app';

type ConfigDoc = {
  welcomeVideoUrl?: string | null;
  welcomeVideoSubtitles?: SubtitleTrack[];
};

function collectSubtitleUrls(tracks: SubtitleTrack[] | undefined): string[] {
  if (!Array.isArray(tracks)) return [];
  return tracks
    .map((track) => track.url)
    .filter((url): url is string => typeof url === 'string' && url.startsWith('https://'));
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const snap = await adminDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
    const data = (snap.data() as ConfigDoc | undefined) || {};
    const url = typeof data.welcomeVideoUrl === 'string' ? data.welcomeVideoUrl : null;
    const subtitles = sanitizeSubtitles(data.welcomeVideoSubtitles);
    return NextResponse.json({
      success: true,
      data: { welcomeVideoUrl: url, welcomeVideoSubtitles: subtitles },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = (await request.json().catch(() => ({}))) as {
      videoUrl?: unknown;
      subtitles?: unknown;
    };

    const ref = adminDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC);
    const prevSnap = await ref.get();
    const prevData = (prevSnap.data() as ConfigDoc | undefined) || {};
    const prevUrl =
      typeof prevData.welcomeVideoUrl === 'string' ? prevData.welcomeVideoUrl : null;
    const prevSubtitles = sanitizeSubtitles(prevData.welcomeVideoSubtitles);

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if ('videoUrl' in body) {
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
      patch.welcomeVideoUrl = next;

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
    }

    if ('subtitles' in body) {
      const nextSubtitles = sanitizeSubtitles(body.subtitles);
      patch.welcomeVideoSubtitles =
        nextSubtitles.length > 0 ? nextSubtitles : FieldValue.delete();

      if (isR2Configured()) {
        const prevUrls = new Set(collectSubtitleUrls(prevSubtitles));
        const nextUrls = new Set(collectSubtitleUrls(nextSubtitles));
        const removed = [...prevUrls].filter((url) => !nextUrls.has(url));
        await Promise.allSettled(
          removed.map(async (url) => {
            const key = keyFromPublicUrl(url);
            if (key) await deleteObject(key);
          }),
        );
      }
    }

    await ref.set(patch, { merge: true });

    const nextSnap = await ref.get();
    const nextData = (nextSnap.data() as ConfigDoc | undefined) || {};
    const welcomeVideoUrl =
      typeof nextData.welcomeVideoUrl === 'string' ? nextData.welcomeVideoUrl : null;
    const welcomeVideoSubtitles = sanitizeSubtitles(nextData.welcomeVideoSubtitles);

    return NextResponse.json({
      success: true,
      data: { welcomeVideoUrl, welcomeVideoSubtitles },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
