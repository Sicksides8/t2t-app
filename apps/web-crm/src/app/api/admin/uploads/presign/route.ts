import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/authHelper';
import { isR2Configured, presignPutUrl, sanitizeFilename } from '../../../../../lib/r2';
import { handleRouteError } from '../../../../../lib/routeError';

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PDF_TYPES = new Set(['application/pdf']);
// Algunos navegadores envían text/plain para .vtt. Aceptamos ambos y
// re-validamos extensión más abajo.
const SUBTITLE_TYPES = new Set(['text/vtt', 'text/plain']);
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 100 * 1024 * 1024;
const MAX_SUBTITLE_BYTES = 2 * 1024 * 1024;
/** TTL del presigned URL: el creador necesita tiempo para subir
 *  archivos grandes (2 GB de video pueden tardar >30 min según conexión). */
const PRESIGN_TTL_VIDEO = 60 * 60; // 1 h
const PRESIGN_TTL_PDF = 30 * 60; // 30 min
const PRESIGN_TTL_DEFAULT = 10 * 60; // 10 min

type UploadKind = 'video' | 'thumbnail' | 'pdf' | 'subtitle';

type PresignBody = {
  kind?: UploadKind;
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
    'application/pdf': 'pdf',
    'text/vtt': 'vtt',
  };
  return map[contentType] || fallback;
}

function folderFor(kind: UploadKind): string {
  if (kind === 'video') return 'videos';
  if (kind === 'pdf') return 'pdfs';
  if (kind === 'subtitle') return 'subtitles';
  return 'thumbnails';
}

function buildKey(kind: UploadKind, scope: string, filename: string, contentType: string): string {
  const folder = folderFor(kind);
  const safeScope = sanitizeFilename(scope || 'misc');
  const ext = (filename.split('.').pop() || extFromContentType(contentType, 'bin')).toLowerCase();
  const safeName = sanitizeFilename(filename.replace(new RegExp(`\\.${ext}$`, 'i'), '')) || 'file';
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${folder}/${safeScope}/${ts}-${rand}-${safeName}.${ext}`;
}

function allowedTypesFor(kind: UploadKind): Set<string> {
  if (kind === 'video') return VIDEO_TYPES;
  if (kind === 'pdf') return PDF_TYPES;
  if (kind === 'subtitle') return SUBTITLE_TYPES;
  return IMAGE_TYPES;
}

function maxBytesFor(kind: UploadKind): number {
  if (kind === 'video') return MAX_VIDEO_BYTES;
  if (kind === 'pdf') return MAX_PDF_BYTES;
  if (kind === 'subtitle') return MAX_SUBTITLE_BYTES;
  return MAX_IMAGE_BYTES;
}

function formatErrorFor(kind: UploadKind): string {
  if (kind === 'video') return 'Formato no soportado. Usá mp4, webm o mov.';
  if (kind === 'pdf') return 'Formato no soportado. Solo se acepta PDF.';
  if (kind === 'subtitle') return 'Formato no soportado. Solo se acepta .vtt.';
  return 'Formato no soportado. Usá jpg, png o webp.';
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

    if (kind !== 'video' && kind !== 'thumbnail' && kind !== 'pdf' && kind !== 'subtitle') {
      return NextResponse.json(
        { success: false, error: { message: 'kind debe ser "video", "thumbnail", "pdf" o "subtitle"' } },
        { status: 400 },
      );
    }
    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { success: false, error: { message: 'filename, contentType y size son obligatorios' } },
        { status: 400 },
      );
    }

    // Para subtítulos, además del contentType, exigimos extensión .vtt para
    // descartar archivos text/plain que no sean VTT (txt, srt, etc).
    if (kind === 'subtitle' && !filename.toLowerCase().endsWith('.vtt')) {
      return NextResponse.json(
        { success: false, error: { message: formatErrorFor(kind) } },
        { status: 400 },
      );
    }

    if (!allowedTypesFor(kind).has(contentType)) {
      return NextResponse.json(
        { success: false, error: { message: formatErrorFor(kind) } },
        { status: 400 },
      );
    }

    const maxBytes = maxBytesFor(kind);
    if (size > maxBytes) {
      const gb = maxBytes / (1024 * 1024 * 1024);
      const sizeLabel =
        gb >= 1
          ? `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`
          : `${Math.round(maxBytes / 1024 / 1024)} MB`;
      return NextResponse.json(
        { success: false, error: { message: `Archivo demasiado grande. Máximo ${sizeLabel}.` } },
        { status: 400 },
      );
    }

    const key = buildKey(kind, scope, filename, contentType);
    const expiresInSeconds =
      kind === 'video'
        ? PRESIGN_TTL_VIDEO
        : kind === 'pdf'
          ? PRESIGN_TTL_PDF
          : PRESIGN_TTL_DEFAULT;
    const presigned = await presignPutUrl({ key, contentType, expiresInSeconds });

    return NextResponse.json({ success: true, data: presigned });
  } catch (error) {
    return handleRouteError(error);
  }
}
