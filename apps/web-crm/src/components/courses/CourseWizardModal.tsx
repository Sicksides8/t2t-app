'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { LEVEL_OPTIONS, SKILL_OPTIONS } from '../../lib/courseConstants';
import type { Course, CreateCourseBody, LessonDraft } from '../../types';
import { LessonListEditor } from './LessonListEditor';
import { newLessonDraft } from './lessonUtils';
import styles from './CourseModal.module.css';

const STEPS = ['Datos basicos', 'Metadata', 'Lecciones', 'Revision'] as const;

type CourseWizardModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  nextOrder: number;
};

export function CourseWizardModal({ open, onClose, onCreated, nextOrder }: CourseWizardModalProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [skillId, setSkillId] = useState('liderazgo');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [level, setLevel] = useState<Course['level']>('beginner');
  const [order, setOrder] = useState(nextOrder);
  const [isActive, setIsActive] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [lessons, setLessons] = useState<LessonDraft[]>([newLessonDraft(1), newLessonDraft(2)]);

  useEffect(() => {
    if (open) setOrder(nextOrder);
  }, [open, nextOrder]);

  const durationMin = useMemo(
    () => Math.max(1, Math.ceil(lessons.reduce((sum, l) => sum + (l.durationSec || 0), 0) / 60)),
    [lessons],
  );

  if (!open) return null;

  function resetAndClose() {
    setStep(0);
    setError(null);
    setTitle('');
    setDescription('');
    setThumbnail('');
    setLessons([newLessonDraft(1), newLessonDraft(2)]);
    onClose();
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!title.trim()) return 'El titulo es obligatorio';
      if (!description.trim()) return 'La descripcion es obligatoria';
    }
    if (current === 2) {
      if (lessons.length === 0) return 'Anade al menos una leccion';
      if (lessons.some((l) => !l.title.trim())) return 'Todas las lecciones necesitan titulo';
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const message = validateStep(2) || validateStep(0);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError(null);
    const body: CreateCourseBody = {
      title: title.trim(),
      skillId,
      description: description.trim(),
      thumbnail: thumbnail.trim() || undefined,
      level,
      order,
      isActive,
      isPremium,
      lessons: lessons.map((lesson) => ({
        title: lesson.title.trim(),
        videoUrl: lesson.videoUrl.trim(),
        durationSec: lesson.durationSec,
        isFree: lesson.isFree,
      })),
    };

    try {
      await apiFetch<{ id: string }>('/api/admin/courses', { method: 'POST', body: JSON.stringify(body) });
      onCreated();
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el curso');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={resetAndClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 id="course-wizard-title">Crear curso</h2>
            <p>Wizard en {STEPS.length} pasos — alineado con catalogo movil.</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={resetAndClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <nav className={styles.steps} aria-label="Pasos del wizard">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={`${styles.step} ${index === step ? styles.stepActive : ''} ${index < step ? styles.stepDone : ''}`}
            >
              {index + 1}. {label}
            </span>
          ))}
        </nav>

        <div className={styles.body}>
          {step === 0 && (
            <div className={styles.fieldGrid}>
              <label className={styles.label}>
                <span>Titulo</span>
                <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label className={styles.label}>
                <span>Habilidad</span>
                <select className={styles.select} value={skillId} onChange={(e) => setSkillId(e.target.value)}>
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className={styles.fieldGrid}>
              <div className={styles.fieldGridTwo}>
                <label className={styles.label}>
                  <span>Nivel</span>
                  <select
                    className={styles.select}
                    value={level}
                    onChange={(e) => setLevel(e.target.value as Course['level'])}
                  >
                    {LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  <span>Orden en catalogo</span>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                  />
                </label>
              </div>
              <label className={styles.label}>
                <span>Thumbnail (URL)</span>
                <input
                  className={styles.input}
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://..."
                />
              </label>
              <div className={styles.checkRow}>
                <label>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Curso activo (visible en app)
                </label>
                <label>
                  <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
                  Premium
                </label>
              </div>
              <p className={styles.hint}>Duracion estimada: {durationMin} min (calculada desde lecciones).</p>
            </div>
          )}

          {step === 2 && <LessonListEditor lessons={lessons} onChange={setLessons} />}

          {step === 3 && (
            <ul className={styles.reviewList}>
              <li>
                <span>Titulo</span>
                <strong>{title}</strong>
              </li>
              <li>
                <span>Habilidad</span>
                <strong>{skillId}</strong>
              </li>
              <li>
                <span>Nivel</span>
                <strong>{level}</strong>
              </li>
              <li>
                <span>Estado</span>
                <strong>{isActive ? 'Activo' : 'Oculto'}</strong>
              </li>
              <li>
                <span>Lecciones</span>
                <strong>{lessons.length}</strong>
              </li>
              <li>
                <span>Duracion</span>
                <strong>{durationMin} min</strong>
              </li>
            </ul>
          )}

          {error ? <p className={styles.error}>{error}</p> : null}
        </div>

        <footer className={styles.footer}>
          <div>
            {step > 0 ? (
              <button type="button" className={styles.secondaryBtn} onClick={goBack} disabled={saving}>
                Atras
              </button>
            ) : null}
          </div>
          <div className={styles.rowActions}>
            {step < STEPS.length - 1 ? (
              <button type="button" className={styles.primaryBtn} onClick={goNext}>
                Siguiente
              </button>
            ) : (
              <button type="button" className={styles.primaryBtn} onClick={submit} disabled={saving}>
                {saving ? 'Creando...' : 'Confirmar y crear'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
