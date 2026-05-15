'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminPage, type AdminColumn } from './AdminPage';
import { CourseEditModal } from './courses/CourseEditModal';
import { CourseWizardModal } from './courses/CourseWizardModal';
import { apiFetch } from '../lib/api';
import type { Course } from '../types';
import styles from '../app/dashboard.module.css';
import modalStyles from './courses/CourseModal.module.css';

export function CoursesView() {
  const [rows, setRows] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Course[]>('/api/admin/courses?includeInactive=1');
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  async function toggleActive(course: Course) {
    setTogglingId(course.id);
    try {
      await apiFetch<Course>(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !course.isActive }),
      });
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado');
    } finally {
      setTogglingId(null);
    }
  }

  const nextOrder = rows.reduce((max, row) => Math.max(max, row.order ?? 0), 0) + 1;

  const columns: AdminColumn<Course>[] = [
    {
      key: 'title',
      label: 'Curso',
      render: (row) => (
        <Link href={`/courses/${row.id}`} className={styles.rowLink}>
          {row.title}
        </Link>
      ),
    },
    { key: 'skillId', label: 'Habilidad' },
    { key: 'level', label: 'Nivel' },
    {
      key: 'durationMin',
      label: 'Duracion',
      render: (row) => `${row.durationMin} min · ${row.totalLessons} lecc.`,
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (row) => <span className={styles.badge}>{row.isActive ? 'Activo' : 'Oculto'}</span>,
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className={modalStyles.rowActions}>
          <button type="button" className={modalStyles.secondaryBtn} onClick={() => setEditId(row.id)}>
            Editar
          </button>
          <button
            type="button"
            className={`${modalStyles.toggleActive} ${row.isActive ? modalStyles.toggleOn : modalStyles.toggleOff}`}
            disabled={togglingId === row.id}
            onClick={() => toggleActive(row)}
          >
            {togglingId === row.id ? '...' : row.isActive ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPage
        title="Cursos"
        description="Gestion completa: crear con wizard, editar lecciones y activar/desactivar en Firestore (t2t_courses)."
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No hay cursos. Crea el primero con el boton de abajo."
        headerAction={
          <button type="button" className={styles.linkButton} onClick={() => setWizardOpen(true)}>
            Crear curso
          </button>
        }
      />
      <CourseWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={loadCourses}
        nextOrder={nextOrder}
      />
      <CourseEditModal courseId={editId} onClose={() => setEditId(null)} onSaved={loadCourses} />
    </>
  );
}
