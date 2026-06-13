'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Info } from 'lucide-react';
import { AppShell } from './layout/AppShell';
import { MetricCard } from './ui/MetricCard';
import { apiFetch } from '../lib/api';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../lib/format';
import type { CohortBucket, RetentionKpis } from '../types';
import styles from '../app/dashboard.module.css';

type CohortsResponse = {
  granularity: 'week' | 'month';
  cohorts: CohortBucket[];
  maxPeriods: number;
};

type Granularity = 'week' | 'month';

export function RetencionView() {
  const [kpis, setKpis] = useState<RetentionKpis | null>(null);
  const [cohorts, setCohorts] = useState<CohortsResponse | null>(null);
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, cohortRes] = await Promise.all([
        apiFetch<RetentionKpis>('/api/admin/retention/summary'),
        apiFetch<CohortsResponse>(`/api/admin/retention/cohorts?granularity=${granularity}&cohorts=12`),
      ]);
      setKpis(summary);
      setCohorts(cohortRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar retencion');
    } finally {
      setLoading(false);
    }
  }, [granularity]);

  useEffect(() => {
    load();
  }, [load]);

  const churnChartData = useMemo(
    () =>
      (kpis?.churnSeries ?? []).map((m) => ({
        month: m.month,
        churnPct: Math.round(m.rate * 1000) / 10,
        cancelled: m.cancelled,
        activeStart: m.activeStart,
      })),
    [kpis],
  );

  const maxPeriods = cohorts?.maxPeriods ?? 8;
  const periodLabel = granularity === 'week' ? 'Sem' : 'Mes';

  return (
    <AppShell title="Retencion">
      <section className={styles.panel}>
        <p className={styles.description}>
          <Info size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Las cohortes usan <code>t2t_coins_transactions</code> como senal de actividad (cada
          leccion completada genera una tx). Churn calculado sobre{' '}
          <code>t2t_subscriptions</code> usando <code>startDate</code> y <code>cancelledAt</code>.
        </p>
        <div className={styles.form}>
          <label>
            <span className={styles.muted}>Granularidad</span>{' '}
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
            >
              <option value="week">Semanal</option>
              <option value="month">Mensual</option>
            </select>
          </label>
          <button type="button" onClick={load} disabled={loading}>
            Recargar
          </button>
        </div>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading && !kpis ? <p className={styles.status}>Cargando retencion...</p> : null}

      <section className={styles.grid} style={{ marginTop: 18 }}>
        <MetricCard label="Retencion D1" value={kpis ? formatPercent(kpis.d1) : '—'} />
        <MetricCard label="Retencion D7" value={kpis ? formatPercent(kpis.d7) : '—'} />
        <MetricCard label="Retencion D30" value={kpis ? formatPercent(kpis.d30) : '—'} />
        <MetricCard
          label="Churn mensual"
          value={kpis ? formatPercent(kpis.churnMonthly) : '—'}
          hint="Cancelaciones / activas al inicio del mes"
        />
        <MetricCard
          label="ARPU mensual"
          value={kpis ? formatCurrency(kpis.arpu) : '—'}
          hint={kpis ? `${formatNumber(kpis.payingUsers)} pagadores` : undefined}
        />
        <MetricCard
          label="LTV"
          value={kpis ? formatCurrency(kpis.ltv) : '—'}
          hint="ARPU / churn (o ARPU x 12 si churn=0)"
        />
      </section>

      <section className={styles.panel}>
        <h2 style={{ marginTop: 0 }}>Cohortes de retencion</h2>
        {!cohorts || cohorts.cohorts.length === 0 ? (
          <p className={styles.empty}>
            {loading
              ? 'Cargando cohortes...'
              : 'Aun no hay datos suficientes para mostrar cohortes.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cohorte</th>
                  <th>Tamano</th>
                  {Array.from({ length: maxPeriods }).map((_, i) => (
                    <th key={i}>{`${periodLabel} ${i}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.cohorts.map((c) => (
                  <tr key={c.cohort}>
                    <td>
                      <strong>{c.cohort}</strong>
                    </td>
                    <td>{formatNumber(c.size)}</td>
                    {Array.from({ length: maxPeriods }).map((_, i) => {
                      const v = c.retention[i];
                      if (v === undefined) {
                        return (
                          <td key={i} style={{ color: 'rgba(255,255,255,0.25)' }}>
                            —
                          </td>
                        );
                      }
                      return (
                        <td
                          key={i}
                          style={{
                            background: `hsl(150, 60%, ${20 + Math.round(v * 50)}%)`,
                            color: v > 0.5 ? '#0E1B12' : 'rgba(255,255,255,0.92)',
                            textAlign: 'center',
                            fontWeight: 700,
                            borderRadius: 6,
                          }}
                          title={`${c.cohort} ${periodLabel} ${i}: ${formatPercent(v)}`}
                        >
                          {formatPercent(v, 0)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.grid} style={{ marginTop: 18, gridTemplateColumns: '2fr 1fr' }}>
        <article className={styles.panel} style={{ margin: 0 }}>
          <h3 style={{ marginTop: 0 }}>Churn mensual (ultimos 6 meses)</h3>
          {churnChartData.length === 0 ? (
            <p className={styles.empty}>Sin datos.</p>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={churnChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1F0A40',
                      border: '1px solid rgba(255,255,255,0.16)',
                      borderRadius: 12,
                    }}
                    formatter={(value) => [`${Number(value ?? 0)}%`, 'Churn'] as [string, string]}
                  />
                  <Bar dataKey="churnPct" fill="#FF5C7A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
        <article className={styles.panel} style={{ margin: 0 }}>
          <h3 style={{ marginTop: 0 }}>LTV por plan</h3>
          {kpis && kpis.ltvByPlan.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Pagadores</th>
                  <th>ARPU</th>
                  <th>LTV</th>
                </tr>
              </thead>
              <tbody>
                {kpis.ltvByPlan.map((p) => (
                  <tr key={p.plan}>
                    <td>{p.plan.toUpperCase()}</td>
                    <td>{formatNumber(p.payers)}</td>
                    <td>{formatCurrency(p.arpu)}</td>
                    <td>{formatCurrency(p.ltv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.empty}>Sin pagadores este mes.</p>
          )}
        </article>
      </section>
    </AppShell>
  );
}
