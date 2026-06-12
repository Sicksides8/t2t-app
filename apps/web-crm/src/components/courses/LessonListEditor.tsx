'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  Link2,
  ListPlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LessonDraft, ModuleLink } from '../../types';
import { MediaUploader } from './MediaUploader';
import {
  draftsFromTitles,
  duplicateDraft,
  formatDurationMMSS,
  lessonFromDraft,
  moveDraft,
  newLessonDraft,
  parseDurationInput,
} from './lessonUtils';
import styles from './CourseModal.module.css';

type LessonListEditorProps = {
  lessons: LessonDraft[];
  onChange: (lessons: LessonDraft[]) => void;
  onAssetReplaced?: (url: string) => void;
  scope?: string;
  /** Si true, marcamos como inválida cualquier lección sin título o sin URL de video. */
  validateMedia?: boolean;
  disabled?: boolean;
};

export function LessonListEditor({
  lessons,
  onChange,
  onAssetReplaced,
  scope = 'new',
  validateMedia = false,
  disabled,
}: LessonListEditorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function update(clientId: string, patch: Partial<LessonDraft>) {
    onChange(lessons.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)));
  }

  function remove(clientId: string) {
    onChange(
      lessons.filter((item) => item.clientId !== clientId).map((item, index) => ({ ...item, order: index + 1 })),
    );
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(clientId);
      return next;
    });
  }

  function add() {
    const fresh = newLessonDraft(lessons.length + 1);
    onChange([...lessons, fresh]);
    setExpanded((prev) => new Set(prev).add(fresh.clientId));
  }

  function duplicate(clientId: string) {
    const next = duplicateDraft(lessons, clientId);
    onChange(next);
  }

  function toggleExpanded(clientId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = lessons.findIndex((l) => l.clientId === active.id);
    const to = lessons.findIndex((l) => l.clientId === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(lessons, from, to).map(lessonFromDraft);
    onChange(next);
  }

  const ids = useMemo(() => lessons.map((l) => l.clientId), [lessons]);

  return (
    <div className={styles.lessonList}>
      {lessons.length === 0 ? (
        <p className={styles.hint}>Aún no hay módulos. Agregá el primero para empezar.</p>
      ) : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
          {lessons.map((lesson, index) => (
            <SortableLessonRow
              key={lesson.clientId}
              lesson={lesson}
              index={index}
              total={lessons.length}
              expanded={expanded.has(lesson.clientId)}
              validateMedia={validateMedia}
              disabled={disabled}
              scope={scope}
              onToggle={() => toggleExpanded(lesson.clientId)}
              onUpdate={(patch) => update(lesson.clientId, patch)}
              onRemove={() => remove(lesson.clientId)}
              onDuplicate={() => duplicate(lesson.clientId)}
              onMove={(dir) => onChange(moveDraft(lessons, lesson.clientId, dir))}
              onAssetReplaced={onAssetReplaced}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className={styles.bulkActions}>
        <button type="button" className={styles.secondaryBtn} onClick={add} disabled={disabled}>
          <Plus size={16} /> Añadir módulo
        </button>
        <button type="button" className={styles.iconBtn} onClick={() => setBulkOpen(true)} disabled={disabled}>
          <ListPlus size={14} /> Pegar lista de títulos
        </button>
      </div>

      {bulkOpen ? (
        <BulkPasteModal
          onCancel={() => setBulkOpen(false)}
          onConfirm={(titles) => {
            const generated = draftsFromTitles(titles, lessons.length + 1);
            onChange([...lessons, ...generated].map(lessonFromDraft));
            setBulkOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

type SortableLessonRowProps = {
  lesson: LessonDraft;
  index: number;
  total: number;
  expanded: boolean;
  validateMedia: boolean;
  disabled?: boolean;
  scope: string;
  onToggle: () => void;
  onUpdate: (patch: Partial<LessonDraft>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
  onAssetReplaced?: (url: string) => void;
};

function SortableLessonRow({
  lesson,
  index,
  total,
  expanded,
  validateMedia,
  disabled,
  scope,
  onToggle,
  onUpdate,
  onRemove,
  onDuplicate,
  onMove,
  onAssetReplaced,
}: SortableLessonRowProps) {
  const sortable = useSortable({ id: lesson.clientId, disabled });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const titleMissing = !lesson.title.trim();
  const videoMissing = validateMedia && !lesson.videoUrl?.trim();
  const isInvalid = titleMissing || videoMissing;

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={`${styles.lessonCard} ${isInvalid ? styles.lessonRowInvalid : ''} ${
        sortable.isDragging ? styles.lessonRowDragging : ''
      }`}
    >
      <div className={styles.lessonRow}>
        <button
          type="button"
          className={styles.lessonHandle}
          aria-label="Mover módulo"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <GripVertical size={16} />
        </button>
        <span className={styles.lessonNumber}>{index + 1}</span>
        <input
          className={styles.lessonTitleInput}
          value={lesson.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder={`Título del módulo ${index + 1}`}
          disabled={disabled}
        />
        <div className={styles.lessonBadges}>
          <span className={styles.lessonBadge}>{formatDurationMMSS(lesson.durationSec)}</span>
          {lesson.isFree ? (
            <span className={`${styles.lessonBadge} ${styles.lessonBadgeFree}`}>Gratis</span>
          ) : null}
        </div>
        <div className={styles.lessonRowActions}>
          <button
            type="button"
            className={styles.miniBtn}
            aria-label="Mover arriba"
            onClick={() => onMove(-1)}
            disabled={disabled || index === 0}
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            className={styles.miniBtn}
            aria-label="Mover abajo"
            onClick={() => onMove(1)}
            disabled={disabled || index === total - 1}
          >
            <ArrowDown size={16} />
          </button>
          <button
            type="button"
            className={styles.miniBtn}
            aria-label="Duplicar"
            onClick={onDuplicate}
            disabled={disabled}
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
            aria-label="Eliminar"
            onClick={onRemove}
            disabled={disabled}
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            className={styles.miniBtn}
            aria-label={expanded ? 'Contraer' : 'Expandir'}
            onClick={onToggle}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>
      {expanded ? (
        <div className={styles.lessonExpanded}>
          <div className={styles.lessonExpandedLabel}>Video del módulo</div>
          <MediaUploader
            kind="video"
            value={lesson.videoUrl || undefined}
            scope={scope}
            disabled={disabled}
            onPrevReplaced={(url) => onAssetReplaced?.(url)}
            onChange={(url, meta) => {
              const patch: Partial<LessonDraft> = { videoUrl: url || '' };
              if (meta?.durationSec && meta.durationSec > 0) {
                patch.durationSec = meta.durationSec;
              }
              onUpdate(patch);
            }}
          />
          <div className={styles.lessonExpandedLabel}>Material PDF del módulo (opcional)</div>
          <MediaUploader
            kind="pdf"
            compact
            value={lesson.pdfUrl || undefined}
            scope={scope}
            disabled={disabled}
            onPrevReplaced={(url) => onAssetReplaced?.(url)}
            onChange={(url) => onUpdate({ pdfUrl: url || '' })}
          />
          <div className={styles.lessonExpandedLabel}>Enlaces externos del módulo (opcional)</div>
          <LinksEditor
            links={lesson.links || []}
            disabled={disabled}
            onChange={(next) => onUpdate({ links: next.length > 0 ? next : undefined })}
          />
          <div className={styles.fieldGridTwo}>
            <DurationField
              valueSec={lesson.durationSec}
              onChange={(seconds) => onUpdate({ durationSec: seconds })}
            />
            <FreeToggle isFree={lesson.isFree} onChange={(value) => onUpdate({ isFree: value })} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LinksEditor({
  links,
  disabled,
  onChange,
}: {
  links: ModuleLink[];
  disabled?: boolean;
  onChange: (next: ModuleLink[]) => void;
}) {
  function update(index: number, patch: Partial<ModuleLink>) {
    const next = links.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  }

  function remove(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...links, { label: '', url: '' }]);
  }

  return (
    <div className={styles.linksEditor}>
      {links.length === 0 ? (
        <p className={styles.linksHint}>
          Sumá enlaces a recursos externos (Google Docs, artículos, planillas...). Cada módulo
          puede tener los que necesite.
        </p>
      ) : (
        <ul className={styles.linksList} role="list">
          {links.map((link, index) => {
            const url = (link.url || '').trim();
            const invalid = url.length > 0 && !isLikelyValidUrl(url);
            return (
              <li key={index} className={styles.linkRow}>
                <span className={styles.linkIcon} aria-hidden>
                  <Link2 size={14} />
                </span>
                <div className={styles.linkFields}>
                  <input
                    type="text"
                    className={styles.linkLabelInput}
                    value={link.label || ''}
                    onChange={(e) => update(index, { label: e.target.value })}
                    placeholder="Nombre (opcional, ej: Plantilla Google Docs)"
                    maxLength={80}
                    disabled={disabled}
                    aria-label={`Nombre del enlace ${index + 1}`}
                  />
                  <input
                    type="url"
                    inputMode="url"
                    className={`${styles.linkUrlInput} ${invalid ? styles.inputInvalid : ''}`}
                    value={link.url}
                    onChange={(e) => update(index, { url: e.target.value })}
                    placeholder="https://..."
                    disabled={disabled}
                    aria-label={`URL del enlace ${index + 1}`}
                  />
                </div>
                <button
                  type="button"
                  className={styles.linkRemoveBtn}
                  aria-label={`Eliminar enlace ${index + 1}`}
                  onClick={() => remove(index)}
                  disabled={disabled}
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" className={styles.linkAddBtn} onClick={add} disabled={disabled}>
        <Plus size={14} /> Añadir enlace
      </button>
    </div>
  );
}

function isLikelyValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch {
    return false;
  }
}

function DurationField({
  valueSec,
  onChange,
}: {
  valueSec: number;
  onChange: (seconds: number) => void;
}) {
  const [text, setText] = useState(formatDurationMMSS(valueSec));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(formatDurationMMSS(valueSec));
  }, [valueSec]);

  function commit(value: string) {
    const parsed = parseDurationInput(value);
    if (parsed == null) {
      setError('Usá el formato mm:ss (ej: 7:30)');
      return;
    }
    setError(null);
    const safe = Math.max(30, parsed);
    onChange(safe);
    setText(formatDurationMMSS(safe));
  }

  return (
    <label className={styles.label}>
      <span>Duración</span>
      <input
        className={`${styles.input} ${error ? styles.inputInvalid : ''}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        placeholder="7:00"
        inputMode="numeric"
      />
      {error ? <span className={styles.errorText}>{error}</span> : null}
      <span className={styles.hint}>Formato mm:ss. Mínimo 30 segundos.</span>
    </label>
  );
}

function FreeToggle({ isFree, onChange }: { isFree: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={styles.label}>
      <span>Acceso</span>
      <button
        type="button"
        className={styles.toggleCard}
        onClick={() => onChange(!isFree)}
        style={{ textAlign: 'left', cursor: 'pointer' }}
      >
        <div className={styles.toggleCardText}>
          <strong>Módulo gratis</strong>
          <span>{isFree ? 'Visible sin suscripción' : 'Solo para suscriptores'}</span>
        </div>
        <span className={`${styles.switch} ${isFree ? styles.switchOn : ''}`}>
          <span className={styles.switchKnob} />
        </span>
      </button>
    </label>
  );
}

function BulkPasteModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (titles: string[]) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const titles = text
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className={styles.bulkModalOverlay} role="presentation" onClick={onCancel}>
      <div
        className={styles.bulkModal}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, fontSize: 18 }}>Pegar lista de títulos</h3>
        <p className={styles.hint}>
          Un módulo por línea. Te creamos {titles.length || 'N'} módulos nuevos con título y un video por
          defecto que podrás reemplazar después.
        </p>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Módulo 1: introducción\nMódulo 2: práctica\nMódulo 3: cierre'}
        />
        <div className={styles.rowActions} style={{ justifyContent: 'flex-end' }}>
          <button type="button" className={styles.secondaryBtn} onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => onConfirm(titles)}
            disabled={titles.length === 0}
          >
            Crear {titles.length} módulos
          </button>
        </div>
      </div>
    </div>
  );
}
