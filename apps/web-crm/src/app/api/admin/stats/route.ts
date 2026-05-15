import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../lib/authHelper';
import { FS_COL } from '../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../lib/routeError';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const [users, courses, subscriptions] = await Promise.all([
      adminDb.collection(FS_COL.users).count().get(),
      adminDb.collection(FS_COL.courses).count().get(),
      adminDb.collection(FS_COL.subscriptions).where('status', '==', 'active').count().get(),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: users.data().count,
        totalCourses: courses.data().count,
        activeSubscriptions: subscriptions.data().count,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
