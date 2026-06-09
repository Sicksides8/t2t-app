import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/authHelper';
import { deleteObject, isR2Configured, keyFromPublicUrl } from '../../../../../lib/r2';
import { handleRouteError } from '../../../../../lib/routeError';

type CleanupBody = {
  keys?: string[];
  urls?: string[];
};

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, error: { message: 'R2 no está configurado en el servidor' } },
        { status: 503 },
      );
    }

    const body = (await request.json()) as CleanupBody;
    const keysFromUrls = (body.urls || []).map((url) => keyFromPublicUrl(url)).filter((k): k is string => Boolean(k));
    const keys = Array.from(new Set([...(body.keys || []), ...keysFromUrls])).filter(Boolean);

    const results = await Promise.allSettled(keys.map((key) => deleteObject(key)));
    const deleted = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - deleted;

    return NextResponse.json({ success: true, data: { deleted, failed, total: results.length } });
  } catch (error) {
    return handleRouteError(error);
  }
}
