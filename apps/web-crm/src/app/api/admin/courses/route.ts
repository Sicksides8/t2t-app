import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/authHelper';
import { MOCK_VIDEO_URL } from '../../../../lib/courseConstants';
import { computeCourseStats, syncCourseCurriculum } from '../../../../lib/courseAdminServer';
import { adminDb } from '../../../../lib/firebase-admin';
import { FS_COL } from '../../../../lib/firestoreCollections';
import { withoutUndefined } from '../../../../lib/firestoreDoc';
import { handleRouteError } from '../../../../lib/routeError';
import type { Course, CreateCourseBody } from '../../../../types';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === '1';
    let query = adminDb.collection(FS_COL.courses).orderBy('order', 'asc');
    if (!includeInactive) {
      query = adminDb.collection(FS_COL.courses).where('isActive', '==', true).orderBy('order', 'asc');
    }
    const snapshot = await query.get();
    const rows: Course[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Course, 'id'>),
    }));
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as CreateCourseBody;
    const title = String(body.title || '').trim();
    const skillId = String(body.skillId || '').trim();
    const description = String(body.description || '').trim();
    if (!title || !skillId || !description) {
      return NextResponse.json(
        { success: false, error: { message: 'Titulo, habilidad y descripcion son obligatorios' } },
        { status: 400 },
      );
    }

    const lessonsInput = (body.lessons || []).map((lesson, index) => {
      const pdfUrl = lesson.pdfUrl ? String(lesson.pdfUrl).trim() : '';
      return {
        title: String(lesson.title || `Modulo ${index + 1}`).trim(),
        videoUrl: String(lesson.videoUrl || MOCK_VIDEO_URL).trim(),
        ...(pdfUrl ? { pdfUrl } : {}),
        durationSec: Math.max(30, Number(lesson.durationSec) || 420),
        order: index + 1,
        isFree: Boolean(lesson.isFree ?? index === 0),
      };
    });

    const stats = computeCourseStats(lessonsInput);
    const now = new Date();
    let order = typeof body.order === 'number' ? body.order : 100;
    try {
      const countSnap = await adminDb.collection(FS_COL.courses).count().get();
      order = typeof body.order === 'number' ? body.order : countSnap.data().count + 1;
    } catch {
      // count() puede fallar sin indice; fallback seguro
    }

    const courseRef = adminDb.collection(FS_COL.courses).doc();
    const courseId = courseRef.id;
    const thumb = body.thumbnail?.trim();
    const pdfUrl = body.pdfUrl?.trim();
    const accessTier =
      body.accessTier && ['free', 'lite', 'premium'].includes(body.accessTier) ? body.accessTier : undefined;
    const isPremium =
      typeof body.isPremium === 'boolean' ? body.isPremium : accessTier ? accessTier !== 'free' : false;
    const courseData = withoutUndefined({
      title,
      skillId,
      description,
      ...(thumb ? { thumbnail: thumb } : {}),
      ...(pdfUrl ? { pdfUrl } : {}),
      level: body.level || 'beginner',
      ...(accessTier ? { accessTier } : {}),
      isActive: body.isActive !== false,
      isPremium,
      order,
      totalLessons: stats.totalLessons,
      durationMin: stats.durationMin,
      createdAt: now,
      updatedAt: now,
    });

    await courseRef.set(courseData);

    if (lessonsInput.length > 0) {
      await syncCourseCurriculum(adminDb, courseId, lessonsInput, body.moduleTitle);
    }

    return NextResponse.json({ success: true, data: { id: courseId } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
