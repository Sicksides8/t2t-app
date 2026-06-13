import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../lib/authHelper';
import { FS_COL } from '../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../lib/routeError';
import { toDate } from '../../../../../lib/paymentsServer';
import {
  addDaysUtc,
  addMonthsUtc,
  isoWeekLabel,
  monthLabel,
  startOfIsoWeek,
  startOfMonthUtc,
} from '../../../../../lib/cohorts';
import type { CohortBucket } from '../../../../../types';

type Granularity = 'week' | 'month';

const DAY_MS = 24 * 60 * 60 * 1000;

interface Bucket {
  cohort: string;
  startDate: Date;
  userIds: Set<string>;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const granularity = (url.searchParams.get('granularity') === 'month'
      ? 'month'
      : 'week') as Granularity;
    const cohorts = Math.min(24, Math.max(1, Number(url.searchParams.get('cohorts') || 12)));

    const now = new Date();
    // Inicio del periodo mas antiguo que pedimos.
    const oldestStart =
      granularity === 'week'
        ? addDaysUtc(startOfIsoWeek(now), -7 * (cohorts - 1))
        : addMonthsUtc(startOfMonthUtc(now), -(cohorts - 1));

    const [usersSnap, coinsSnap] = await Promise.all([
      adminDb.collection(FS_COL.users).limit(10000).get(),
      adminDb.collection(FS_COL.coinsTransactions).limit(10000).get(),
    ]);

    // Indexar usuarios por cohort
    const buckets = new Map<string, Bucket>();
    const userSignup = new Map<string, Date>();

    for (const doc of usersSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const created = toDate(data.createdAt);
      if (!created || created < oldestStart) continue;

      const cohortStart =
        granularity === 'week' ? startOfIsoWeek(created) : startOfMonthUtc(created);
      const label = granularity === 'week' ? isoWeekLabel(created) : monthLabel(created);
      if (cohortStart < oldestStart) continue;

      let bucket = buckets.get(label);
      if (!bucket) {
        bucket = { cohort: label, startDate: cohortStart, userIds: new Set() };
        buckets.set(label, bucket);
      }
      bucket.userIds.add(doc.id);
      userSignup.set(doc.id, created);
    }

    // Indexar actividad por user
    const userActivity = new Map<string, Date[]>();
    for (const doc of coinsSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const userId = String(data.userId || '');
      if (!userId || !userSignup.has(userId)) continue;
      const ts = toDate(data.createdAt);
      if (!ts) continue;
      const arr = userActivity.get(userId) ?? [];
      arr.push(ts);
      userActivity.set(userId, arr);
    }

    // Calcular retencion por bucket
    const periodMs = granularity === 'week' ? 7 * DAY_MS : 30 * DAY_MS;
    const maxPeriods = granularity === 'week' ? 8 : 6;

    const result: CohortBucket[] = [];

    for (const bucket of buckets.values()) {
      const size = bucket.userIds.size;
      if (size === 0) continue;

      // Cuantos periodos completos caben entre el inicio de la cohort y hoy?
      const elapsedMs = now.getTime() - bucket.startDate.getTime();
      const elapsedPeriods = Math.min(maxPeriods, Math.floor(elapsedMs / periodMs) + 1);
      const retention: number[] = [];

      for (let p = 0; p < elapsedPeriods; p++) {
        const windowStart = bucket.startDate.getTime() + p * periodMs;
        const windowEnd = windowStart + periodMs;
        let active = 0;
        for (const uid of bucket.userIds) {
          const txs = userActivity.get(uid);
          if (!txs) continue;
          if (txs.some((t) => t.getTime() >= windowStart && t.getTime() < windowEnd)) {
            active += 1;
          }
        }
        retention.push(size > 0 ? Math.round((active / size) * 1000) / 1000 : 0);
      }

      result.push({
        cohort: bucket.cohort,
        startDate: bucket.startDate.toISOString(),
        size,
        retention,
      });
    }

    result.sort((a, b) => a.cohort.localeCompare(b.cohort));

    return NextResponse.json({
      success: true,
      data: { granularity, cohorts: result, maxPeriods },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
