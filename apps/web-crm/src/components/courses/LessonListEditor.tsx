'use client';

import { Plus } from 'lucide-react';
import type { LessonDraft } from '../../types';
import { moveDraft, newLessonDraft } from './lessonUtils';
import styles from './CourseModal.module.css';

type LessonListEditorProps = {
  lessons: LessonDraft[];
  onChange: (lessons: LessonDraft[]) => void;
};

export function LessonListEditor({ lessons, onChange }: LessonListEditorProps) {
  function updateLesson(clientId: string, patch: Partial<LessonDraft>) {
    onChange(lessons.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)));
  }

  function removeLesson(clientId: string) {
    onChange(lessons.filter((item) => item.clientId !== clientId).map((item, index) => ({ ...item, order: index + 1 })));
  }

  function addLesson() {
    onChange([...lessons, newLessonDraft(lessons.length + 1)]);
  }

  return (
    <div className={styles.lessonList}>
      {lessons.length === 0 ? (
        <p className={styles.error}>Anade al menos una leccion para publicar el curso.</p>
      ) : null}
      {lessons.map((lesson, index) => (
        <article key={lesson.clientId} className={styles.lessonCard}>
          <div className={styles.lessonCardHead}>
            <strong>Leccion {index + 1}</strong>
            <div className={styles.lessonActions}>
              <button
                type="button"
                className={styles.iconBtn}
                disabled={index === 0}
                onClick={() => onChange(moveDraft(lessons, lesson.clientId, -1))}
              >
                Subir
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                disabled={index === lessons.length - 1}
                onClick={() => onChange(moveDraft(lessons, lesson.clientId, 1))}
              >
                Bajar
              </button>
              <button type="button" className={styles.dangerBtn} onClick={() => removeLesson(lesson.clientId)}>
                Quitar
              </button>
            </div>
          </div>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              <span>Titulo</span>
              <input
                className={styles.input}
                value={lesson.title}
                onChange={(e) => updateLesson(lesson.clientId, { title: e.target.value })}
                placeholder="Titulo de la leccion"
                required
              />
            </label>
            <label className={styles.label}>
              <span>URL del video</span>
              <input
                className={styles.input}
                value={lesson.videoUrl}
                onChange={(e) => updateLesson(lesson.clientId, { videoUrl: e.target.value })}
                placeholder="https://..."
              />
            </label>
            <div className={styles.fieldGridTwo}>
              <label className={styles.label}>
                <span>Duracion (seg)</span>
                <input
                  className={styles.input}
                  type="number"
                  min={30}
                  value={lesson.durationSec}
                  onChange={(e) => updateLesson(lesson.clientId, { durationSec: Number(e.target.value) })}
                />
              </label>
              <label className={styles.checkRow}>
                <span>
                  <input
                    type="checkbox"
                    checked={lesson.isFree}
                    onChange={(e) => updateLesson(lesson.clientId, { isFree: e.target.checked })}
                  />
                  Leccion gratuita
                </span>
              </label>
            </div>
          </div>
        </article>
      ))}
      <button type="button" className={styles.secondaryBtn} onClick={addLesson}>
        <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Anadir leccion
      </button>
    </div>
  );
}
