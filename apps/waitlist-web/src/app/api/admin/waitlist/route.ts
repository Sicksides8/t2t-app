import { NextResponse } from 'next/server';
import { unauthorizedResponse, verifyAdminAuth } from '@/lib/adminAuth';
import { getAdminDb } from '@/lib/firebase-admin';
import { FS_COL, type WaitlistDoc } from '@/lib/firestoreCollections';

function sortByCreatedAtDesc(
  items: Array<{
    id: string;
    email: string;
    status: string;
    createdAt: string | null;
    invitedAt: string | null;
    source: string | null;
  }>,
) {
  return items.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });
}

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);

  try {
    const collection = getAdminDb().collection(FS_COL.waitlist);

    // Sin orderBy en Firestore al filtrar por status: evita índice compuesto hasta deploy.
    // Ordenamos en memoria (volumen bajo en waitlist).
    const snap =
      status === 'pending' || status === 'invited'
        ? await collection.where('status', '==', status).limit(200).get()
        : await collection.orderBy('createdAt', 'desc').limit(limit).get();

    const items = sortByCreatedAtDesc(
      snap.docs.map((doc) => {
        const data = doc.data() as WaitlistDoc;
        return {
          id: doc.id,
          email: data.email,
          status: data.status,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
          invitedAt: data.invitedAt?.toDate?.()?.toISOString() ?? null,
          source: data.source ?? null,
        };
      }),
    ).slice(0, limit);

    return NextResponse.json({ success: true, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al leer waitlist';
    console.error('[admin/waitlist]', err);
    return NextResponse.json(
      {
        success: false,
        error: message.includes('index')
          ? 'Falta un índice en Firestore. Ejecutá: firebase deploy --only firestore:indexes'
          : 'No se pudo cargar la lista de espera',
      },
      { status: 500 },
    );
  }
}
