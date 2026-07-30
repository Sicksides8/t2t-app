import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';
import { FS_COL } from '../../../../../lib/firestoreCollections';

/** Lecciones (módulos) de un curso, ordenadas por `order`. Público para la app móvil. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  try {
    const snapshot = await adminDb
      .collection(FS_COL.lessons)
      .where('courseId', '==', courseId)
      .get();

    const lessons = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : 0;
        const bo = typeof b.order === 'number' ? b.order : 0;
        return ao - bo;
      });

    return NextResponse.json({ success: true, data: lessons });
  } catch (error) {
    console.error(`[GET /api/courses/${courseId}/lessons] firestore error`, error);
    return NextResponse.json(
      { success: false, error: { message: 'No pudimos leer los módulos del curso' } },
      { status: 500 },
    );
  }
}
