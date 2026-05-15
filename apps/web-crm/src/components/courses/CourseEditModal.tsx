'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { LEVEL_OPTIONS, SKILL_OPTIONS } from '../../lib/courseConstants';
import type { Course, CourseDetailPayload, LessonDraft, SyncCurriculumBody } from '../../types';
import { LessonListEditor } from './LessonListEditor';
import { draftsFromLessons } from './lessonUtils';
import styles from './CourseModal.module.css';

type CourseEditModalProps = {
  courseId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function CourseEditModal({ courseId, onClose, onSaved }: CourseEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonDraft[]>([]);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch<CourseDetailPayload>(`/api/admin/courses/${courseId}`)
      .then((data) => {
        if (cancelled) return;
        setCourse(data.course);
        setLessons(draftsFromLessons(data.lessons));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar curso');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!courseId) return null;

  async function save() {
    if (!course) return;
    if (lessons.some((l) => !l.title.trim() || !l.videoUrl.trim())) {
      setError('Cada leccion requiere titulo y URL de video');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch<Course>(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: course.title,
          skillId: course.skillId,
          description: course.description,
          thumbnail: course.thumbnail,
          level: course.level,
          isActive: course.isActive,
          isPremium: course.isPremium,
          order: course.order,
        }),
      });

      const curriculum: SyncCurriculumBody = {
        lessons: lessons.map((lesson, index) => ({
          id: lesson.id,
          title: lesson.title.trim(),
          videoUrl: lesson.videoUrl.trim(),
          durationSec: lesson.durationSec,
          order: index + 1,
          isFree: lesson.isFree,
        })),
      };
      await apiFetch(`/api/admin/courses/${course.id}/curriculum`, {
        method: 'PUT',
        body: JSON.stringify(curriculum),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <h2>Editar curso</h2>
            <p>{course?.title || 'Cargando...'}</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          {loading ? <p className={styles.hint}>Cargando...</p> : null}
          {course ? (
            <>
              <div className={styles.fieldGrid}>
                <label className={styles.label}>
                  <span>Titulo</span>
                  <input
                    className={styles.input}
                    value={course.title}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  />
                </label>
                <label className={styles.label}>
                  <span>Habilidad</span>
                  <select
                    className={styles.select}
                    value={course.skillId}
                    onChange={(e) => setCourse({ ...course, skillId: e.target.value })}
                  >
                    {SKILL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  <span>Descripcion</span>
                  <textarea
                    className={styles.textarea}
                    value={course.description}
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  />
                </label>
                <div className={styles.fieldGridTwo}>
                  <label className={styles.label}>
                    <span>Nivel</span>
                    <select
                      className={styles.select}
                      value={course.level}
                      onChange={(e) => setCourse({ ...course, level: e.target.value as Course['level'] })}
                    >
                      {LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.label}>
                    <span>Orden</span>
                    <input
                      className={styles.input}
                      type="number"
                      value={course.order ?? 1}
                      onChange={(e) => setCourse({ ...course, order: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <label className={styles.label}>
                  <span>Thumbnail (URL)</span>
                  <input
                    className={styles.input}
                    value={course.thumbnail || ''}
                    onChange={(e) => setCourse({ ...course, thumbnail: e.target.value })}
                  />
                </label>
                <div className={styles.checkRow}>
                  <label>
                    <input
                      type="checkbox"
                      checked={course.isPremium ?? false}
                      onChange={(e) => setCourse({ ...course, isPremium: e.target.checked })}
                    />
                    Premium
                  </label>
                </div>
              </div>
              <h3 style={{ margin: '20px 0 8px', fontSize: 16 }}>Lecciones</h3>
              <LessonListEditor lessons={lessons} onChange={setLessons} />
            </>
          ) : null}
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className={styles.primaryBtn} onClick={save} disabled={saving || loading || !course}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </footer>
      </div>
    </div>
  );
}
