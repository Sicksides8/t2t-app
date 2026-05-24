import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    service: 't2t-waitlist',
    status: 'ok',
  });
}
