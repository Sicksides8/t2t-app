import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/authHelper';

export async function POST(request: NextRequest) {
  await requireAdmin(request);
  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: {
      queued: true,
      title: body.title,
      audience: body.audience || 'all',
    },
  });
}
