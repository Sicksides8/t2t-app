import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../lib/authHelper';
import { FS_COL } from '../../../../../lib/firestoreCollections';
import { handleRouteError } from '../../../../../lib/routeError';
import { mapPaymentDoc, toDate } from '../../../../../lib/paymentsServer';
import { monthlyPriceFor } from '../../../../../lib/plans';
import type { RevenueKpis } from '../../../../../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDayUtc(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const days = Math.min(365, Math.max(7, Number(url.searchParams.get('days') || 90)));
    const now = new Date();
    const seriesStart = new Date(now.getTime() - days * DAY_MS);

    const [paymentsSnap, subsSnap] = await Promise.all([
      adminDb.collection(FS_COL.payments).limit(5000).get(),
      adminDb.collection(FS_COL.subscriptions).limit(5000).get(),
    ]);

    const payments = paymentsSnap.docs.map((doc) => mapPaymentDoc(doc.id, doc.data()));

    // ---- KPIs base ----
    let totalRevenue = 0;
    let monthRevenue = 0;
    let yearRevenue = 0;
    let paidCount = 0;
    let refundedCount = 0;
    let currency = 'USD';

    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    const byPlanMap = new Map<string, { count: number; revenue: number }>();
    const byMethodMap = new Map<string, { count: number; revenue: number }>();
    const seriesMap = new Map<string, { revenue: number; count: number }>();

    // Sembramos la serie con todos los dias (revenue=0) para que el chart sea continuo.
    for (let i = 0; i < days; i++) {
      const d = new Date(seriesStart.getTime() + i * DAY_MS);
      seriesMap.set(startOfDayUtc(d), { revenue: 0, count: 0 });
    }

    for (const p of payments) {
      if (p.currency) currency = p.currency;

      if (p.status === 'refunded') {
        refundedCount += 1;
        continue;
      }
      if (p.status !== 'paid') continue;

      const paidDate = p.paidAt ? new Date(p.paidAt) : null;
      paidCount += 1;
      totalRevenue += p.amount;

      if (paidDate && paidDate >= monthStart) monthRevenue += p.amount;
      if (paidDate && paidDate >= yearStart) yearRevenue += p.amount;

      const planBucket = byPlanMap.get(p.plan) ?? { count: 0, revenue: 0 };
      planBucket.count += 1;
      planBucket.revenue += p.amount;
      byPlanMap.set(p.plan, planBucket);

      const methodBucket = byMethodMap.get(p.method) ?? { count: 0, revenue: 0 };
      methodBucket.count += 1;
      methodBucket.revenue += p.amount;
      byMethodMap.set(p.method, methodBucket);

      if (paidDate && paidDate >= seriesStart) {
        const day = startOfDayUtc(paidDate);
        const bucket = seriesMap.get(day) ?? { revenue: 0, count: 0 };
        bucket.revenue += p.amount;
        bucket.count += 1;
        seriesMap.set(day, bucket);
      }
    }

    const avgTicket = paidCount > 0 ? totalRevenue / paidCount : 0;

    // ---- MRR (suma mensualizada de subs active/trialing) ----
    let mrr = 0;
    for (const doc of subsSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const status = String(data.status || 'free').toLowerCase();
      if (status !== 'active' && status !== 'trialing') continue;
      const planId = String(data.planId || 'free');
      const cycle = String(data.cycle || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
      mrr += monthlyPriceFor(planId, cycle);
    }

    const timeseries = Array.from(seriesMap.entries())
      .map(([day, v]) => ({ day, revenue: round2(v.revenue), count: v.count }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const byPlan = Array.from(byPlanMap.entries())
      .map(([plan, v]) => ({ plan, count: v.count, revenue: round2(v.revenue) }))
      .sort((a, b) => b.revenue - a.revenue);

    const byMethod = Array.from(byMethodMap.entries())
      .map(([method, v]) => ({ method, count: v.count, revenue: round2(v.revenue) }))
      .sort((a, b) => b.revenue - a.revenue);

    const data: RevenueKpis = {
      totalRevenue: round2(totalRevenue),
      monthRevenue: round2(monthRevenue),
      yearRevenue: round2(yearRevenue),
      avgTicket: round2(avgTicket),
      paidCount,
      refundedCount,
      mrr: round2(mrr),
      currency,
      byPlan,
      byMethod,
      timeseries,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleRouteError(error);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Marcar como dynamic para que Next no intente cachear.
export const dynamic = 'force-dynamic';

// Evitar warning de no-unused (toDate se mantiene exportado por si lo usan otros).
void toDate;
