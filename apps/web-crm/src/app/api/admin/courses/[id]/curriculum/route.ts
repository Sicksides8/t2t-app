import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../lib/authHelper';
import { fetchCourseCurriculum, syncCourseCurriculum } from '../../../../../../lib/courseAdminServer';
import { adminDb } from '../../../../../../lib/firebase-admin';
import { FS_COL } from '../../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../../lib/routeError';
import type { SyncCurriculumBody } from '../../../../../../types';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id: courseId } = await params;
    const courseRef = adminDb.collection(FS_COL.courses).doc(courseId);
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) {
      return NextResponse.json({ success: false, error: { message: 'Curso no encontrado' } }, { status: 404 });
    }

    const body = (await request.json()) as SyncCurriculumBody;
    const lessons = (body.lessons || []).map((lesson, index) => {
      const pdfUrl = lesson.pdfUrl ? String(lesson.pdfUrl).trim() : '';
      return {
        id: lesson.id,
        title: String(lesson.title || '').trim(),
        videoUrl: String(lesson.videoUrl || '').trim(),
        ...(pdfUrl ? { pdfUrl } : {}),
        durationSec: Math.max(30, Number(lesson.durationSec) || 420),
        order: typeof lesson.order === 'number' ? lesson.order : index + 1,
        isFree: Boolean(lesson.isFree),
      };
    });

    if (lessons.some((l) => !l.title || !l.videoUrl)) {
      return NextResponse.json(
        { success: false, error: { message: 'Cada modulo requiere titulo y URL de video' } },
        { status: 400 },
      );
    }

    await syncCourseCurriculum(adminDb, courseId, lessons, body.moduleTitle);
    const payload = await fetchCourseCurriculum(adminDb, courseId);
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    return handleRouteError(error);
  }
}
