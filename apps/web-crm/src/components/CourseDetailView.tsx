'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { AppShell } from './layout/AppShell';
import { CourseFormModal } from './courses/CourseFormModal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from './ui/Toast';
import { apiFetch } from '../lib/api';
import { LEVEL_OPTIONS, SKILL_OPTIONS } from '../lib/courseConstants';
import type { Course, CourseDetailPayload } from '../types';
import styles from '../app/dashboard.module.css';
import filterStyles from './CoursesFilters.module.css';
import modalStyles from './courses/CourseModal.module.css';

const LEVEL_LABEL: Record<Course['level'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};
const SKILL_LABEL: Record<string, string> = SKILL_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.value]: opt.label }),
  {} as Record<string, string>,
);

void LEVEL_OPTIONS;

export function CourseDetailView({ courseId }: { courseId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [payload, setPayload] = useState<CourseDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    const next = !payload.course.isActive;
    setToggling(true);
    setPayload((prev) => (prev ? { ...prev, course: { ...prev.course, isActive: next } } : prev));
    try {
      await apiFetch<Course>(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      });
      toast.show({
        tone: 'success',
        message: next ? 'El curso ahora se ve en la app.' : 'El curso quedó oculto en la app.',
      });
    } catch (err) {
      setPayload((prev) =>
        prev ? { ...prev, course: { ...prev.course, isActive: !next } } : prev,
      );
      toast.show({
        tone: 'error',
        title: 'No se pudo actualizar',
        message: err instanceof Error ? err.message : 'Error desconocido',
      });
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!payload) return;
    setDeleting(true);
    try {
      const result = await apiFetch<{ deletedLessons: number; r2Deleted: number }>(
        `/api/admin/courses/${courseId}`,
        { method: 'DELETE' },
      );
      toast.show({
        tone: 'success',
        title: 'Curso eliminado',
        message: `Se borraron ${result.deletedLessons} lecciones y ${result.r2Deleted} archivos en R2.`,
      });
      router.push('/courses');
    } catch (err) {
      toast.show({
        tone: 'error',
        title: 'No se pudo eliminar',
        message: err instanceof Error ? err.message : 'Error desconocido',
      });
      setDeleting(false);
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
          <div className={modalStyles.rowActions} style={{ marginBottom: 16, alignItems: 'center' }}>
            <button type="button" className={modalStyles.primaryBtn} onClick={() => setEditOpen(true)}>
              Editar curso y lecciones
            </button>
            <button
              type="button"
              className={`${filterStyles.toggle} ${course.isActive ? filterStyles.toggleOn : ''}`}
              role="switch"
              aria-checked={course.isActive}
              disabled={toggling}
              onClick={toggleActive}
            >
              <span className={filterStyles.toggleKnob} />
              <span className={filterStyles.toggleLabel}>
                {course.isActive ? 'Visible en la app' : 'Oculto en la app'}
              </span>
            </button>
            <button
              type="button"
              className={modalStyles.dangerBtn}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={16} /> Eliminar curso
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
                <dd>{SKILL_LABEL[course.skillId] || course.skillId}</dd>
              </div>
              <div>
                <dt>Nivel</dt>
                <dd>{LEVEL_LABEL[course.level] || course.level}</dd>
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
      <CourseFormModal
        open={editOpen}
        mode="edit"
        courseId={courseId}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar este curso?"
        message={
          course
            ? `Vas a borrar "${course.title}" y sus ${course.totalLessons} lecciones, junto con los videos en R2. Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => (deleting ? null : setConfirmDelete(false))}
      />
    </AppShell>
  );
}
