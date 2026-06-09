import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/authHelper';
import { isR2Configured, presignPutUrl, sanitizeFilename } from '../../../../../lib/r2';
import { handleRouteError } from '../../../../../lib/routeError';

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type PresignBody = {
  kind?: 'video' | 'thumbnail';
  filename?: string;
  contentType?: string;
  size?: number;
  scope?: string;
};

function extFromContentType(contentType: string, fallback: string): string {
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[contentType] || fallback;
}

function buildKey(kind: 'video' | 'thumbnail', scope: string, filename: string, contentType: string): string {
  const folder = kind === 'video' ? 'videos' : 'thumbnails';
  const safeScope = sanitizeFilename(scope || 'misc');
  const ext = (filename.split('.').pop() || extFromContentType(contentType, 'bin')).toLowerCase();
  const safeName = sanitizeFilename(filename.replace(new RegExp(`\\.${ext}$`, 'i'), '')) || 'file';
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${folder}/${safeScope}/${ts}-${rand}-${safeName}.${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, error: { message: 'R2 no está configurado en el servidor' } },
        { status: 503 },
      );
    }

    const body = (await request.json()) as PresignBody;
    const kind = body.kind;
    const filename = String(body.filename || '').trim();
    const contentType = String(body.contentType || '').trim();
    const size = Number(body.size || 0);
    const scope = String(body.scope || 'new').trim();

    if (kind !== 'video' && kind !== 'thumbnail') {
      return NextResponse.json(
        { success: false, error: { message: 'kind debe ser "video" o "thumbnail"' } },
        { status: 400 },
      );
    }
    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { success: false, error: { message: 'filename, contentType y size son obligatorios' } },
        { status: 400 },
      );
    }

    const allowed = kind === 'video' ? VIDEO_TYPES : IMAGE_TYPES;
    if (!allowed.has(contentType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              kind === 'video'
                ? 'Formato no soportado. Usá mp4, webm o mov.'
                : 'Formato no soportado. Usá jpg, png o webp.',
          },
        },
        { status: 400 },
      );
    }

    const maxBytes = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (size > maxBytes) {
      const mb = Math.round(maxBytes / 1024 / 1024);
      return NextResponse.json(
        { success: false, error: { message: `Archivo demasiado grande. Máximo ${mb} MB.` } },
        { status: 400 },
      );
    }

    const key = buildKey(kind, scope, filename, contentType);
    const presigned = await presignPutUrl({ key, contentType });

    return NextResponse.json({ success: true, data: presigned });
  } catch (error) {
    return handleRouteError(error);
  }
}
