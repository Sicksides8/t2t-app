import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '../../../../../lib/authHelper';
import { fetchCourseCurriculum } from '../../../../../lib/courseAdminServer';
import { adminDb } from '../../../../../lib/firebase-admin';
import { FS_COL } from '../../../../../lib/firestoreCollections';
import { deleteObject, isR2Configured, keyFromPublicUrl } from '../../../../../lib/r2';
import { handleRouteError } from '../../../../../lib/routeError';
import type { Course, PatchCourseBody } from '../../../../../types';

const PATCHABLE_KEYS: (keyof PatchCourseBody)[] = [
  'title',
  'skillId',
  'description',
  'thumbnail',
  'pdfUrl',
  'level',
  'accessTier',
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
    if (typeof update.skillId === 'string') update.skillId = update.skillId.trim();
    if (typeof update.description === 'string') update.description = update.description.trim();
    if (typeof update.thumbnail === 'string') {
      const thumb = update.thumbnail.trim();
      update.thumbnail = thumb || FieldValue.delete();
    } else if (update.thumbnail === null) {
      update.thumbnail = FieldValue.delete();
    }
    if (typeof update.pdfUrl === 'string') {
      const pdf = update.pdfUrl.trim();
      update.pdfUrl = pdf || FieldValue.delete();
    } else if (update.pdfUrl === null) {
      update.pdfUrl = FieldValue.delete();
    }
    if (typeof update.accessTier === 'string') {
      const tier = update.accessTier.trim();
      if (!['free', 'lite', 'premium'].includes(tier)) {
        delete update.accessTier;
      } else {
        update.accessTier = tier;
        if (typeof update.isPremium !== 'boolean') {
          update.isPremium = tier !== 'free';
        }
      }
    }

    await ref.update(update);
    const next = await ref.get();
    const course = { id: next.id, ...(next.data() as Omit<Course, 'id'>) } as Course;
    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const courseRef = adminDb.collection(FS_COL.courses).doc(id);
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) {
      return NextResponse.json(
        { success: false, error: { message: 'Curso no encontrado' } },
        { status: 404 },
      );
    }

    const courseData = courseSnap.data() as Partial<Course>;
    const [modulesSnap, lessonsSnap] = await Promise.all([
      adminDb.collection(FS_COL.modules).where('courseId', '==', id).get(),
      adminDb.collection(FS_COL.lessons).where('courseId', '==', id).get(),
    ]);

    const r2Keys = new Set<string>();
    if (isR2Configured()) {
      if (courseData.thumbnail) {
        const k = keyFromPublicUrl(String(courseData.thumbnail));
        if (k) r2Keys.add(k);
      }
      if (courseData.pdfUrl) {
        const k = keyFromPublicUrl(String(courseData.pdfUrl));
        if (k) r2Keys.add(k);
      }
      for (const doc of lessonsSnap.docs) {
        const data = doc.data() as { videoUrl?: string; pdfUrl?: string };
        if (data.videoUrl) {
          const k = keyFromPublicUrl(data.videoUrl);
          if (k) r2Keys.add(k);
        }
        if (data.pdfUrl) {
          const k = keyFromPublicUrl(data.pdfUrl);
          if (k) r2Keys.add(k);
        }
      }
    }

    const batch = adminDb.batch();
    for (const doc of lessonsSnap.docs) batch.delete(doc.ref);
    for (const doc of modulesSnap.docs) batch.delete(doc.ref);
    batch.delete(courseRef);
    await batch.commit();

    let r2Deleted = 0;
    let r2Failed = 0;
    if (r2Keys.size > 0) {
      const results = await Promise.allSettled(
        Array.from(r2Keys).map((key) => deleteObject(key)),
      );
      r2Deleted = results.filter((r) => r.status === 'fulfilled').length;
      r2Failed = results.length - r2Deleted;
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        deletedLessons: lessonsSnap.size,
        deletedModules: modulesSnap.size,
        r2Deleted,
        r2Failed,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
