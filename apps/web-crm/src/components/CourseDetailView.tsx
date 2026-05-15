'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from './layout/AppShell';
import { CourseEditModal } from './courses/CourseEditModal';
import { apiFetch } from '../lib/api';
import type { Course, CourseDetailPayload } from '../types';
import styles from '../app/dashboard.module.css';
import modalStyles from './courses/CourseModal.module.css';

export function CourseDetailView({ courseId }: { courseId: string }) {
  const [payload, setPayload] = useState<CourseDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CourseDetailPayload>(`/api/admin/courses/${courseId}`);
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Curso no encontrado');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive() {
    if (!payload) return;
    setToggling(true);
    try {
      await apiFetch<Course>(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !payload.course.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
    } finally {
      setToggling(false);
    }
  }

  const course = payload?.course;
  const lessons = payload?.lessons ?? [];

  return (
    <AppShell title={course?.title || 'Detalle de curso'}>
      <p className={styles.back}>
        <Link href="/courses">← Volver a cursos</Link>
      </p>
      {loading ? <p className={styles.status}>Cargando curso...</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {course ? (
        <>
          <div className={modalStyles.rowActions} style={{ marginBottom: 16 }}>
            <button type="button" className={modalStyles.primaryBtn} onClick={() => setEditOpen(true)}>
              Editar curso y lecciones
            </button>
            <button
              type="button"
              className={`${modalStyles.toggleActive} ${course.isActive ? modalStyles.toggleOn : modalStyles.toggleOff}`}
              disabled={toggling}
              onClick={toggleActive}
            >
              {toggling ? 'Actualizando...' : course.isActive ? 'Desactivar curso' : 'Activar curso'}
            </button>
          </div>
          <section className={styles.panel}>
            <dl className={styles.detailList}>
              <div>
                <dt>ID</dt>
                <dd>{course.id}</dd>
              </div>
              <div>
                <dt>Habilidad</dt>
                <dd>{course.skillId}</dd>
              </div>
              <div>
                <dt>Nivel</dt>
                <dd>{course.level}</dd>
              </div>
              <div>
                <dt>Lecciones</dt>
                <dd>{course.totalLessons}</dd>
              </div>
              <div>
                <dt>Duracion</dt>
                <dd>{course.durationMin} min</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>
                  <span className={styles.badge}>{course.isActive ? 'Activo' : 'Oculto'}</span>
                </dd>
              </div>
              <div>
                <dt>Descripcion</dt>
                <dd>{course.description}</dd>
              </div>
            </dl>
          </section>
          <section className={styles.panel}>
            <h2 style={{ marginTop: 0 }}>Lecciones ({lessons.length})</h2>
            {lessons.length === 0 ? (
              <p className={styles.muted}>Sin lecciones. Usa Editar para anadir contenido.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Titulo</th>
                    <th>Duracion</th>
                    <th>Gratis</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => (
                      <tr key={lesson.id}>
                        <td>{lesson.order}</td>
                        <td>{lesson.title}</td>
                        <td>{Math.round(lesson.durationSec / 60)} min</td>
                        <td>{lesson.isFree ? 'Si' : 'No'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
      <CourseEditModal
        courseId={editOpen ? courseId : null}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />
    </AppShell>
  );
}
