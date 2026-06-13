'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from './layout/AppShell';
import { MetricCard } from './ui/MetricCard';
import { apiFetch } from '../lib/api';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';
import type { AdminStats, Course, RetentionKpis, RevenueKpis } from '../types';
import styles from '../app/dashboard.module.css';

type CourseWithMeta = Course & {
  createdAt?: string | { _seconds?: number } | Date;
  updatedAt?: string | { _seconds?: number } | Date;
};

function toMillis(value: CourseWithMeta['createdAt']): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && '_seconds' in value && typeof value._seconds === 'number') {
    return value._seconds * 1000;
  }
  return 0;
}

export function DashboardView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [courses, setCourses] = useState<CourseWithMeta[]>([]);
  const [revenue, setRevenue] = useState<RevenueKpis | null>(null);
  const [retention, setRetention] = useState<RetentionKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsData, coursesData, revenueData, retentionData] = await Promise.all([
          apiFetch<AdminStats>('/api/admin/stats'),
          apiFetch<CourseWithMeta[]>('/api/admin/courses?includeInactive=1'),
          apiFetch<RevenueKpis>('/api/admin/revenue/summary').catch(() => null),
          apiFetch<RetentionKpis>('/api/admin/retention/summary').catch(() => null),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setCourses(coursesData);
          setRevenue(revenueData);
          setRetention(retentionData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const recentCourses = useMemo(() => {
    return courses
      .slice()
      .sort((a, b) => {
        const am = toMillis(a.createdAt) || toMillis(a.updatedAt);
        const bm = toMillis(b.createdAt) || toMillis(b.updatedAt);
        if (bm !== am) return bm - am;
        return (a.order ?? 0) - (b.order ?? 0);
      })
      .slice(0, 12);
  }, [courses]);

  return (
    <AppShell title="Dashboard">
      {loading ? <p className={styles.status}>Cargando metricas...</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.grid}>
        <MetricCard label="Alumnos registrados" value={stats ? formatNumber(stats.totalUsers) : '—'} />
        <MetricCard label="Cursos en catalogo" value={stats ? formatNumber(stats.totalCourses) : '—'} />
        <MetricCard label="Suscripciones activas" value={stats ? formatNumber(stats.activeSubscriptions) : '—'} />
        <MetricCard label="Cursos en el panel" value={formatNumber(courses.length)} />
      </section>

      <section className={styles.grid} style={{ marginTop: 18 }}>
        <MetricCard
          label="MRR"
          value={revenue ? formatCurrency(revenue.mrr, revenue.currency) : '—'}
        />
        <MetricCard
          label="Ingresos del mes"
          value={revenue ? formatCurrency(revenue.monthRevenue, revenue.currency) : '—'}
        />
        <MetricCard
          label="Churn mensual"
          value={retention ? formatPercent(retention.churnMonthly) : '—'}
        />
        <MetricCard
          label="Retencion D7"
          value={retention ? formatPercent(retention.d7) : '—'}
        />
      </section>

      <section className={styles.panel}>
        <h2>Últimos cursos</h2>
        {!loading && !error ? (
          recentCourses.length === 0 ? (
            <div className={styles.empty} style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ marginTop: 0 }}>Todavía no hay cursos en el catálogo.</p>
              <Link href="/courses" className={styles.rowLink}>
                + Crear el primer curso
              </Link>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Habilidad</th>
                  <th>Duracion</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <Link href={`/courses/${course.id}`} className={styles.rowLink}>
                        {course.title}
                      </Link>
                    </td>
                    <td>{course.skillId}</td>
                    <td>{course.durationMin} min</td>
                    <td>
                      <span className={styles.badge}>{course.isActive ? 'Activo' : 'Oculto'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : null}
      </section>
    </AppShell>
  );
}

