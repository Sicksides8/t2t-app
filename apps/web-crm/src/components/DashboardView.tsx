'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from './layout/AppShell';
import { apiFetch } from '../lib/api';
import { formatNumber } from '../lib/format';
import type { AdminStats, Course } from '../types';
import styles from '../app/dashboard.module.css';

export function DashboardView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsData, coursesData] = await Promise.all([
          apiFetch<AdminStats>('/api/admin/stats'),
          apiFetch<Course[]>('/api/courses'),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setCourses(coursesData);
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

  return (
    <AppShell title="Dashboard">
      {loading ? <p className={styles.status}>Cargando metricas...</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.grid}>
        <Metric label="Alumnos registrados" value={stats ? formatNumber(stats.totalUsers) : '—'} />
        <Metric label="Cursos en catalogo" value={stats ? formatNumber(stats.totalCourses) : '—'} />
        <Metric label="Suscripciones activas" value={stats ? formatNumber(stats.activeSubscriptions) : '—'} />
        <Metric label="Cursos visibles (API)" value={formatNumber(courses.length)} />
      </section>

      <section className={styles.panel}>
        <h2>Cursos destacados</h2>
        {!loading && !error ? (
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
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    No hay cursos. Ejecuta el seed de Firestore o crea uno desde Cursos.
                  </td>
                </tr>
              ) : (
                courses.slice(0, 12).map((course) => (
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
                ))
              )}
            </tbody>
          </table>
        ) : null}
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className={styles.card}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
