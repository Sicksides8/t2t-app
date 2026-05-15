import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';
import { FS_COL } from './firestoreCollections';

export async function requireUser(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const decoded = await adminAuth.verifyIdToken(token);
  const userSnap = await adminDb.collection(FS_COL.users).doc(decoded.uid).get();
  return {
    uid: decoded.uid,
    email: decoded.email || '',
    role: userSnap.exists ? userSnap.data()?.role || 'student' : 'student',
  };
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireUser(request);
  if (user.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }
  return user;
}

export function apiError(error: unknown) {
  if (error instanceof Response) return error;
  console.error(error);
  return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
}
