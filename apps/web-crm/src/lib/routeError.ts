import { NextResponse } from 'next/server';
import { apiError } from './authHelper';

export function handleRouteError(error: unknown) {
  if (error instanceof Response) {
    const message = error.status === 403 ? 'Acceso denegado' : 'No autorizado';
    return NextResponse.json({ success: false, error: { message } }, { status: error.status });
  }
  return apiError(error);
}
