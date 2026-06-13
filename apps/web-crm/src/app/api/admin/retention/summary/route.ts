import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../lib/authHelper';
import { FS_COL } from '../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../lib/routeError';
import { mapPaymentDoc, toDate } from '../../../../../lib/paymentsServer';
import { addMonthsUtc, monthLabel, startOfMonthUtc } from '../../../../../lib/cohorts';
import type { RetentionKpis } from '../../../../../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function activeOnDay(
  signup: Date,
  activity: Date[] | undefined,
  day: number,
  toleranceDays = 1,
): boolean {
  if (!activity || activity.length === 0) return false;
  const windowStart = signup.getTime() + day * DAY_MS;
  const windowEnd = windowStart + toleranceDays * DAY_MS;
  return activity.some((t) => t.getTime() >= windowStart && t.getTime() < windowEnd);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const now = new Date();
    const oldestRelevant = new Date(now.getTime() - 180 * DAY_MS); // 6 meses

    const [usersSnap, coinsSnap, paymentsSnap, subsSnap] = await Promise.all([
      adminDb.collection(FS_COL.users).limit(10000).get(),
      adminDb.collection(FS_COL.coinsTransactions).limit(20000).get(),
      adminDb.collection(FS_COL.payments).limit(10000).get(),
      adminDb.collection(FS_COL.subscriptions).limit(10000).get(),
    ]);

    // ---- Mapas ----
    const userSignup = new Map<string, Date>();
    const userPlan = new Map<string, string>();
    for (const doc of usersSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const created = toDate(data.createdAt);
      if (!created) continue;
      userSignup.set(doc.id, created);
      userPlan.set(doc.id, String(data.subscriptionPlan || data.selectedPlan || 'free'));
    }

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

    // ---- D1/D7/D30 ----
    const dayKpi = (day: number) => {
      let eligible = 0;
      let active = 0;
      const threshold = now.getTime() - day * DAY_MS;
      for (const [uid, signup] of userSignup.entries()) {
        if (signup.getTime() > threshold) continue; // signup demasiado nuevo
        eligible += 1;
        if (activeOnDay(signup, userActivity.get(uid), day, day === 1 ? 1 : 3)) active += 1;
      }
      return eligible === 0 ? 0 : Math.round((active / eligible) * 1000) / 1000;
    };

    const d1 = dayKpi(1);
    const d7 = dayKpi(7);
    const d30 = dayKpi(30);

    // ---- Churn series (ultimos 6 meses) ----
    type SubStat = {
      status: string;
      planId: string;
      cycle: string;
      startDate: Date | null;
      cancelledAt: Date | null;
    };
    const subs: SubStat[] = [];
    for (const doc of subsSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      subs.push({
        status: String(data.status || 'free').toLowerCase(),
        planId: String(data.planId || 'free'),
        cycle: String(data.cycle || 'monthly').toLowerCase(),
        startDate: toDate(data.startDate),
        cancelledAt: toDate(data.cancelledAt),
      });
    }

    const churnSeries: RetentionKpis['churnSeries'] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = addMonthsUtc(startOfMonthUtc(now), -i);
      const monthEnd = addMonthsUtc(monthStart, 1);

      let cancelled = 0;
      let activeStart = 0;
      for (const s of subs) {
        const sub = s;
        if (sub.cancelledAt && sub.cancelledAt >= monthStart && sub.cancelledAt < monthEnd) {
          cancelled += 1;
        }
        // Activo al inicio: startDate <= monthStart && (cancelledAt nulo || cancelledAt >= monthStart)
        if (sub.startDate && sub.startDate < monthStart) {
          if (!sub.cancelledAt || sub.cancelledAt >= monthStart) activeStart += 1;
        }
      }
      const rate = activeStart === 0 ? 0 : Math.round((cancelled / activeStart) * 1000) / 1000;
      churnSeries.push({
        month: monthLabel(monthStart),
        cancelled,
        activeStart,
        rate,
      });
    }

    const lastMonth = churnSeries[churnSeries.length - 1];
    const churnMonthly = lastMonth?.rate ?? 0;

    // ---- ARPU / LTV ----
    const monthStart = startOfMonthUtc(now);
    let monthRevenue = 0;
    const monthPayers = new Set<string>();
    const planRevenue = new Map<string, number>();
    const planPayers = new Map<string, Set<string>>();

    for (const doc of paymentsSnap.docs) {
      const p = mapPaymentDoc(doc.id, doc.data());
      if (p.status !== 'paid') continue;
      const paidDate = p.paidAt ? new Date(p.paidAt) : null;
      if (paidDate && paidDate >= monthStart) {
        monthRevenue += p.amount;
        monthPayers.add(p.userId);

        planRevenue.set(p.plan, (planRevenue.get(p.plan) ?? 0) + p.amount);
        const setForPlan = planPayers.get(p.plan) ?? new Set<string>();
        setForPlan.add(p.userId);
        planPayers.set(p.plan, setForPlan);
      }
      if (paidDate && paidDate >= oldestRelevant) {
        // Asociar al ultimo plan visto del usuario
        userPlan.set(p.userId, p.plan);
      }
    }

    const payingUsers = monthPayers.size;
    const arpu = payingUsers > 0 ? monthRevenue / payingUsers : 0;
    // Si churn = 0 asumimos LTV = ARPU * 12 (vida estimada de 1 ano).
    const ltv = churnMonthly > 0 ? arpu / churnMonthly : arpu * 12;

    const ltvByPlan = Array.from(planRevenue.entries()).map(([plan, revenue]) => {
      const payers = planPayers.get(plan)?.size ?? 0;
      const planArpu = payers > 0 ? revenue / payers : 0;
      const planLtv = churnMonthly > 0 ? planArpu / churnMonthly : planArpu * 12;
      return {
        plan,
        arpu: Math.round(planArpu * 100) / 100,
        payers,
        ltv: Math.round(planLtv * 100) / 100,
      };
    });
    ltvByPlan.sort((a, b) => b.ltv - a.ltv);

    const data: RetentionKpis = {
      d1,
      d7,
      d30,
      churnMonthly,
      ltv: Math.round(ltv * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      payingUsers,
      ltvByPlan,
      churnSeries,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const dynamic = 'force-dynamic';
