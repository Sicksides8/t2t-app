import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../lib/authHelper';
import { adminDb } from '../../../lib/firebase-admin';
import { FS_COL } from '../../../lib/firestoreCollections';
import { handleRouteError } from '../../../lib/routeError';
import { slugifySkill } from '../../../lib/skillId';

type CourseDoc = { id: string; order?: number; isActive?: boolean; [key: string]: unknown };

/**
 * Endpoint público leído por la app móvil.
 *
 * Importante: NO ordenamos en Firestore para no depender de un índice
 * compuesto (isActive + order o isActive + skillId + order). Antes esto
 * fallaba y caía a seedCourses, ocultando los cursos reales y mostrando
 * mocks. Ahora ordenamos en memoria.
 */
export async function GET(request: NextRequest) {
  const skillIdParam = request.nextUrl.searchParams.get('skillId');
  const skillId = skillIdParam ? slugifySkill(skillIdParam) : null;
  try {
    let query = adminDb.collection(FS_COL.courses).where('isActive', '==', true);
    if (skillId) {
      query = query.where('skillId', '==', skillId);
    }
    const snapshot = await query.get();
    const data = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as CourseDoc)
      .sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        return ao - bo;
      });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/courses] firestore error', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const ref = await adminDb.collection(FS_COL.courses).add({ ...body, createdAt: new Date(), updatedAt: new Date() });
    return NextResponse.json({ success: true, data: { id: ref.id } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
