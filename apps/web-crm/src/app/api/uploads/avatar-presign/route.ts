import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/authHelper';
import { isR2Configured, presignPutUrl, sanitizeFilename } from '../../../../lib/r2';
import { handleRouteError } from '../../../../lib/routeError';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const PRESIGN_TTL = 10 * 60;

type Body = {
  contentType?: string;
  size?: number;
  filename?: string;
};

function extFromContentType(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

/**
 * Presign PUT a R2 para avatar del alumno autenticado.
 * Key: avatars/{uid}/{ts}-{rand}.{ext}
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, error: { message: 'R2 no está configurado en el servidor' } },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Body;
    const contentType = String(body.contentType || '').trim().toLowerCase();
    const size = Number(body.size || 0);
    const filename = String(body.filename || 'avatar.jpg').trim();

    if (!IMAGE_TYPES.has(contentType)) {
      return NextResponse.json(
        { success: false, error: { message: 'Formato no soportado. Usá jpg, png o webp.' } },
        { status: 400 },
      );
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json(
        { success: false, error: { message: 'size es obligatorio' } },
        { status: 400 },
      );
    }
    if (size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { success: false, error: { message: 'Imagen demasiado grande. Máximo 5 MB.' } },
        { status: 400 },
      );
    }

    const ext = extFromContentType(contentType);
    const safeBase =
      sanitizeFilename(filename.replace(/\.[a-z0-9]+$/i, '')) || 'avatar';
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const key = `avatars/${user.uid}/${ts}-${rand}-${safeBase}.${ext}`;

    const presigned = await presignPutUrl({
      key,
      contentType,
      expiresInSeconds: PRESIGN_TTL,
    });

    return NextResponse.json({ success: true, data: presigned });
  } catch (error) {
    return handleRouteError(error);
  }
}
