import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/authHelper';
import { fetchCourseCurriculum } from '../../../../../lib/courseAdminServer';
import { adminDb } from '../../../../../lib/firebase-admin';
import { FS_COL } from '../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../lib/routeError';
import type { Course, PatchCourseBody } from '../../../../../types';

const PATCHABLE_KEYS: (keyof PatchCourseBody)[] = [
  'title',
  'skillId',
  'description',
  'thumbnail',
  'level',
  'isActive',
  'isPremium',
  'order',
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const payload = await fetchCourseCurriculum(adminDb, id);
    if (!payload) {
      return NextResponse.json({ success: false, error: { message: 'Curso no encontrado' } }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = (await request.json()) as PatchCourseBody;
    const ref = adminDb.collection(FS_COL.courses).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: { message: 'Curso no encontrado' } }, { status: 404 });
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of PATCHABLE_KEYS) {
      if (body[key] !== undefined) {
        update[key] = body[key];
      }
    }

    if (typeof update.title === 'string') update.title = update.title.trim();
    if (typeof update.description === 'string') update.description = update.description.trim();
    if (typeof update.thumbnail === 'string') {
      const thumb = update.thumbnail.trim();
      update.thumbnail = thumb || null;
    }

    await ref.update(update);
    const next = await ref.get();
    const course = { id: next.id, ...(next.data() as Omit<Course, 'id'>) } as Course;
    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    return handleRouteError(error);
  }
}
