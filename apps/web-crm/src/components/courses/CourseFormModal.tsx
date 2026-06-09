'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  HelpCircle,
  ImageIcon,
  Info,
  ListChecks,
  Sparkles,
  X,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { LEVEL_OPTIONS, MOCK_VIDEO_URL, SKILL_OPTIONS } from '../../lib/courseConstants';
import type {
  Course,
  CourseDetailPayload,
  CreateCourseBody,
  LessonDraft,
  SyncCurriculumBody,
} from '../../types';
import { useToast } from '../ui/Toast';
import { LessonListEditor } from './LessonListEditor';
import { MediaUploader } from './MediaUploader';
import {
  clearDraft,
  type CourseFormSnapshot,
  formatRelativeTime,
  loadDraft,
  saveDraft,
} from './courseDraft';
import { draftsFromLessons, lessonFromDraft, newLessonDraft } from './lessonUtils';
import styles from './CourseModal.module.css';

type Mode = 'create' | 'edit';

type CourseFormModalProps = {
  open: boolean;
  mode: Mode;
  courseId?: string | null;
  onClose: () => void;
  onSaved: () => void;
  /** En create, orden sugerido para el nuevo curso. */
  nextOrder?: number;
};

type SectionId = 'course' | 'cover' | 'lessons' | 'publish';

type SectionState = 'empty' | 'partial' | 'complete' | 'invalid';

const DEMO_SNAPSHOT: CourseFormSnapshot = {
  title: 'Liderazgo humano para equipos modernos',
  skillId: 'liderazgo',
  description:
    'Aprende a liderar con confianza, claridad y conversaciones difíciles bien llevadas. Ideal para coordinadores y mandos medios que quieren acompañar mejor a sus equipos.',
  thumbnail: '',
  level: 'beginner',
  isActive: true,
  isPremium: false,
  lessons: [
    {
      clientId: `demo_${Date.now()}_1`,
      title: 'Bienvenida y promesa del curso',
      videoUrl: MOCK_VIDEO_URL,
      durationSec: 360,
      order: 1,
      isFree: true,
    },
    {
      clientId: `demo_${Date.now()}_2`,
      title: 'Cómo dar feedback que se escucha',
      videoUrl: MOCK_VIDEO_URL,
      durationSec: 540,
      order: 2,
      isFree: false,
    },
    {
      clientId: `demo_${Date.now()}_3`,
      title: 'Acuerdos de equipo en 4 pasos',
      videoUrl: MOCK_VIDEO_URL,
      durationSec: 480,
      order: 3,
      isFree: false,
    },
  ],
};

function emptySnapshot(): CourseFormSnapshot {
  return {
    title: '',
    skillId: 'liderazgo',
    description: '',
    thumbnail: '',
    level: 'beginner',
    isActive: true,
    isPremium: false,
    lessons: [newLessonDraft(1), newLessonDraft(2)],
  };
}

function computeCourseSection(snapshot: CourseFormSnapshot): SectionState {
  const filled = [snapshot.title.trim(), snapshot.description.trim()].filter(Boolean).length;
  if (filled === 0) return 'empty';
  if (filled === 2) return 'complete';
  return 'partial';
}

function computeCoverSection(snapshot: CourseFormSnapshot): SectionState {
  if (snapshot.thumbnail.trim()) return 'complete';
  return 'partial';
}

function computeLessonsSection(snapshot: CourseFormSnapshot, mode: Mode): SectionState {
  if (snapshot.lessons.length === 0) return 'invalid';
  const hasInvalidTitle = snapshot.lessons.some((l) => !l.title.trim());
  if (hasInvalidTitle) return 'invalid';
  if (mode === 'edit') {
    const hasInvalidVideo = snapshot.lessons.some((l) => !l.videoUrl?.trim());
    if (hasInvalidVideo) return 'invalid';
  }
  return 'complete';
}

function totalDurationMin(lessons: LessonDraft[]): number {
  return Math.max(1, Math.ceil(lessons.reduce((sum, l) => sum + (l.durationSec || 0), 0) / 60));
}

function snapshotsEqual(a: CourseFormSnapshot, b: CourseFormSnapshot): boolean {
  if (
    a.title !== b.title ||
    a.skillId !== b.skillId ||
    a.description !== b.description ||
    a.thumbnail !== b.thumbnail ||
    a.level !== b.level ||
    a.isActive !== b.isActive ||
    a.isPremium !== b.isPremium ||
    a.lessons.length !== b.lessons.length
  ) {
    return false;
  }
  for (let i = 0; i < a.lessons.length; i += 1) {
    const la = a.lessons[i];
    const lb = b.lessons[i];
    if (
      la.title !== lb.title ||
      la.videoUrl !== lb.videoUrl ||
      la.durationSec !== lb.durationSec ||
      la.isFree !== lb.isFree ||
      la.order !== lb.order
    ) {
      return false;
    }
  }
  return true;
}

export function CourseFormModal({
  open,
  mode,
  courseId,
  onClose,
  onSaved,
  nextOrder,
}: CourseFormModalProps) {
  const toast = useToast();
  const scope = mode === 'edit' && courseId ? courseId : 'new';

  const [snapshot, setSnapshot] = useState<CourseFormSnapshot>(() => emptySnapshot());
  const [initialSnapshot, setInitialSnapshot] = useState<CourseFormSnapshot>(() => emptySnapshot());
  const [openSections, setOpenSections] = useState<Set<SectionId>>(() => new Set(['course']));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [pendingDraft, setPendingDraft] = useState<{ savedAt: number } | null>(null);
  const [orphanUrls, setOrphanUrls] = useState<string[]>([]);

  const loadSeqRef = useRef(0);

  const dirty = useMemo(() => !snapshotsEqual(snapshot, initialSnapshot), [snapshot, initialSnapshot]);

  // Carga inicial / reset al abrir
  useEffect(() => {
    if (!open) return;
    setError(null);
    setOrphanUrls([]);
    loadSeqRef.current += 1;
    const seq = loadSeqRef.current;

    if (mode === 'edit' && courseId) {
      setLoading(true);
      apiFetch<CourseDetailPayload>(`/api/admin/courses/${courseId}`)
        .then((data) => {
          if (loadSeqRef.current !== seq) return;
          const initial: CourseFormSnapshot = {
            title: data.course.title || '',
            skillId: data.course.skillId || 'liderazgo',
            description: data.course.description || '',
            thumbnail: data.course.thumbnail || '',
            level: data.course.level || 'beginner',
            isActive: data.course.isActive !== false,
            isPremium: Boolean(data.course.isPremium),
            lessons: draftsFromLessons(data.lessons),
          };
          setInitialSnapshot(initial);
          setSnapshot(initial);
          setSavedAt(null);
          setPendingDraft(null);
        })
        .catch((err) => {
          if (loadSeqRef.current !== seq) return;
          setError(err instanceof Error ? err.message : 'No se pudo cargar el curso');
        })
        .finally(() => {
          if (loadSeqRef.current === seq) setLoading(false);
        });
    } else {
      const fresh = emptySnapshot();
      setInitialSnapshot(fresh);
      setSnapshot(fresh);
      const stored = loadDraft(scope);
      if (stored) {
        setPendingDraft({ savedAt: stored.savedAt });
      } else {
        setPendingDraft(null);
      }
      setSavedAt(null);
    }
    setOpenSections(new Set(['course']));
  }, [open, mode, courseId, scope]);

  // Autosave en localStorage (solo en create, después de cambios reales)
  useEffect(() => {
    if (!open || mode !== 'create') return;
    if (!dirty) return;
    const handle = window.setTimeout(() => {
      saveDraft(scope, snapshot);
      setSavedAt(Date.now());
    }, 1500);
    return () => window.clearTimeout(handle);
  }, [snapshot, dirty, open, mode, scope]);

  // Tick para refrescar el "hace Xs" del autosave
  useEffect(() => {
    if (!open) return;
    const handle = window.setInterval(() => setNowTick(Date.now()), 5000);
    return () => window.clearInterval(handle);
  }, [open]);

  // Confirmación al cerrar el browser con cambios
  useEffect(() => {
    if (!open || !dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [open, dirty]);

  const courseState = useMemo(() => computeCourseSection(snapshot), [snapshot]);
  const coverState = useMemo(() => computeCoverSection(snapshot), [snapshot]);
  const lessonsState = useMemo(() => computeLessonsSection(snapshot, mode), [snapshot, mode]);
  const publishState: SectionState = 'complete';

  const completionPct = useMemo(() => {
    const must: SectionState[] = [courseState, lessonsState];
    const optional: SectionState[] = [coverState];
    const mustWeight = 0.4;
    const optionalWeight = 0.1;

    let score = 0;
    let max = 0;
    must.forEach((state) => {
      max += mustWeight;
      if (state === 'complete') score += mustWeight;
      else if (state === 'partial') score += mustWeight * 0.5;
    });
    optional.forEach((state) => {
      max += optionalWeight;
      if (state === 'complete') score += optionalWeight;
    });
    return Math.round((score / max) * 100);
  }, [courseState, coverState, lessonsState]);

  const canSubmit = courseState === 'complete' && lessonsState === 'complete' && !saving && !loading;

  function update<K extends keyof CourseFormSnapshot>(key: K, value: CourseFormSnapshot[K]) {
    setSnapshot((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSection(id: SectionId) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function trackOrphan(url: string) {
    if (!url) return;
    setOrphanUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
  }

  async function cleanupOrphans(urls: string[]) {
    if (urls.length === 0) return;
    try {
      await apiFetch('/api/admin/uploads/cleanup', {
        method: 'POST',
        body: JSON.stringify({ urls }),
      });
    } catch {
      // best-effort
    }
  }

  async function handleClose(force = false) {
    if (!force && dirty) {
      const ok = window.confirm('Tenés cambios sin guardar. ¿Cerrar igualmente?');
      if (!ok) return;
    }
    if (orphanUrls.length > 0) {
      void cleanupOrphans(orphanUrls);
    }
    onClose();
  }

  function loadDemo() {
    setSnapshot({
      ...DEMO_SNAPSHOT,
      lessons: DEMO_SNAPSHOT.lessons.map((l, i) => ({
        ...l,
        clientId: `demo_${Date.now()}_${i + 1}`,
      })),
    });
    setOpenSections(new Set(['course', 'lessons']));
  }

  function discardDraft() {
    clearDraft(scope);
    setPendingDraft(null);
  }

  function continueDraft() {
    const stored = loadDraft(scope);
    if (!stored) {
      setPendingDraft(null);
      return;
    }
    setSnapshot({ ...stored.data, lessons: stored.data.lessons.map(lessonFromDraft) });
    setPendingDraft(null);
    setOpenSections(new Set(['course', 'lessons']));
  }

  async function submit() {
    if (mode === 'create') {
      await submitCreate();
    } else {
      await submitEdit();
    }
  }

  async function submitCreate() {
    setSaving(true);
    setError(null);
    const body: CreateCourseBody = {
      title: snapshot.title.trim(),
      skillId: snapshot.skillId,
      description: snapshot.description.trim(),
      thumbnail: snapshot.thumbnail.trim() || undefined,
      level: snapshot.level,
      order: typeof nextOrder === 'number' ? nextOrder : undefined,
      isActive: snapshot.isActive,
      isPremium: snapshot.isPremium,
      lessons: snapshot.lessons.map((lesson) => ({
        title: lesson.title.trim(),
        videoUrl: lesson.videoUrl.trim() || MOCK_VIDEO_URL,
        durationSec: lesson.durationSec,
        isFree: lesson.isFree,
      })),
    };
    try {
      await apiFetch<{ id: string }>('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      clearDraft(scope);
      toast.show({ tone: 'success', title: 'Curso creado', message: 'Ya es visible en la app móvil.' });
      onSaved();
      // Reset y cerrar limpio
      setInitialSnapshot(snapshot);
      setOrphanUrls([]);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el curso';
      setError(message);
      toast.show({ tone: 'error', title: 'Error', message });
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit() {
    if (!courseId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch<Course>(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: snapshot.title.trim(),
          skillId: snapshot.skillId,
          description: snapshot.description.trim(),
          thumbnail: snapshot.thumbnail.trim() || null,
          level: snapshot.level,
          isActive: snapshot.isActive,
          isPremium: snapshot.isPremium,
        }),
      });

      const curriculum: SyncCurriculumBody = {
        lessons: snapshot.lessons.map((lesson, index) => ({
          id: lesson.id,
          title: lesson.title.trim(),
          videoUrl: lesson.videoUrl.trim() || MOCK_VIDEO_URL,
          durationSec: lesson.durationSec,
          order: index + 1,
          isFree: lesson.isFree,
        })),
      };
      await apiFetch(`/api/admin/courses/${courseId}/curriculum`, {
        method: 'PUT',
        body: JSON.stringify(curriculum),
      });
      toast.show({ tone: 'success', title: 'Curso actualizado', message: 'Cambios visibles en la app.' });
      setInitialSnapshot(snapshot);
      setOrphanUrls([]);
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar';
      setError(message);
      toast.show({ tone: 'error', title: 'Error', message });
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const draftSavedLabel =
    savedAt && dirty ? `Borrador guardado ${formatRelativeTime(savedAt)}` : null;

  // referenciar nowTick para forzar render del label cada 5s
  void nowTick;

  return (
    <div className={styles.overlay} role="presentation" onClick={() => void handleClose()}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <div className={styles.headerTitleBlock}>
              <h2 id="course-form-title">{mode === 'create' ? 'Nuevo curso' : 'Editar curso'}</h2>
              <p>
                {mode === 'create'
                  ? 'Completá la información del curso y sus lecciones. Se publica al guardar.'
                  : snapshot.title || 'Cargando...'}
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => void handleClose()}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div>
            <div className={styles.progressMeta}>
              <span>Completitud</span>
              <strong>{completionPct}%</strong>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${completionPct}%` }} />
            </div>
          </div>

          {pendingDraft ? (
            <div className={styles.draftBanner}>
              <span>
                Tenés un borrador guardado {formatRelativeTime(pendingDraft.savedAt)}. ¿Continuarlo?
              </span>
              <div className={styles.rowActions}>
                <button type="button" className={styles.iconBtn} onClick={discardDraft}>
                  Descartar
                </button>
                <button type="button" className={styles.primaryBtn} onClick={continueDraft}>
                  Continuar
                </button>
              </div>
            </div>
          ) : null}
        </header>

        <div className={styles.body}>
          {loading ? <p className={styles.hint}>Cargando curso...</p> : null}

          <Section
            id="course"
            icon={<Info size={18} />}
            title="Información del curso"
            subtitle="Cómo se llama y qué van a aprender"
            state={courseState}
            open={openSections.has('course')}
            onToggle={() => toggleSection('course')}
            headerExtra={
              mode === 'create' ? (
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    loadDemo();
                  }}
                >
                  <Sparkles size={14} /> Ver ejemplo
                </button>
              ) : null
            }
          >
            <div className={styles.fieldGrid}>
              <label className={styles.label}>
                <span>
                  Título <span className={styles.required}>*</span>
                </span>
                <input
                  className={`${styles.input} ${courseState !== 'empty' && !snapshot.title.trim() ? styles.inputInvalid : ''}`}
                  value={snapshot.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Ej: Liderazgo humano para equipos modernos"
                  maxLength={120}
                  required
                />
                <span className={styles.hint}>Lo que se ve grande en la card del catálogo (máx. 120).</span>
              </label>

              <div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  Habilidad <span className={styles.required}>*</span>
                </span>
                <p className={styles.hint} style={{ marginBottom: 8 }}>
                  La categoría con la que se clasifica el curso en la app.
                </p>
                <div className={styles.chips}>
                  {SKILL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.chip} ${
                        snapshot.skillId === opt.value ? styles.chipActive : ''
                      }`}
                      onClick={() => update('skillId', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  Nivel <span className={styles.required}>*</span>
                </span>
                <p className={styles.hint} style={{ marginBottom: 8 }}>
                  Para qué tipo de alumno está pensado.
                </p>
                <div className={styles.chips}>
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.chip} ${
                        snapshot.level === opt.value ? styles.chipActive : ''
                      }`}
                      onClick={() => update('level', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className={styles.label}>
                <span>
                  Descripción <span className={styles.required}>*</span>
                </span>
                <textarea
                  className={`${styles.textarea} ${courseState !== 'empty' && !snapshot.description.trim() ? styles.inputInvalid : ''}`}
                  value={snapshot.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Qué va a aprender el alumno y por qué le sirve. 2-3 oraciones."
                  maxLength={500}
                />
                <span className={styles.hint}>{snapshot.description.length}/500 caracteres.</span>
              </label>
            </div>
          </Section>

          <Section
            id="cover"
            icon={<ImageIcon size={18} />}
            title="Imagen de portada"
            subtitle="Opcional, mejora la card en el catálogo"
            state={coverState}
            open={openSections.has('cover')}
            onToggle={() => toggleSection('cover')}
          >
            <MediaUploader
              kind="thumbnail"
              value={snapshot.thumbnail || undefined}
              scope={scope}
              onPrevReplaced={trackOrphan}
              onChange={(url) => update('thumbnail', url || '')}
            />
            <p className={styles.hint}>
              Recomendado: 1280x720 (16:9), foto clara con poco texto. Si lo dejás vacío, usamos un fondo
              degradado por defecto.
            </p>
          </Section>

          <Section
            id="lessons"
            icon={<ListChecks size={18} />}
            title={`Lecciones (${snapshot.lessons.length})`}
            subtitle={
              snapshot.lessons.length > 0
                ? `Duración total estimada: ${totalDurationMin(snapshot.lessons)} min`
                : 'Agregá al menos una lección para publicar'
            }
            state={lessonsState}
            open={openSections.has('lessons')}
            onToggle={() => toggleSection('lessons')}
          >
            <LessonListEditor
              lessons={snapshot.lessons}
              onChange={(lessons) => update('lessons', lessons)}
              onAssetReplaced={trackOrphan}
              scope={scope}
              validateMedia={mode === 'edit'}
              disabled={saving}
            />
          </Section>

          <Section
            id="publish"
            icon={<Check size={18} />}
            title="Publicación"
            subtitle="Quién puede verlo en la app"
            state={publishState}
            open={openSections.has('publish')}
            onToggle={() => toggleSection('publish')}
          >
            <div className={styles.toggleRow}>
              <ToggleCard
                title="Visible en la app"
                description={
                  snapshot.isActive
                    ? 'Aparece en el catálogo de los alumnos'
                    : 'Oculto: solo lo ven los admins'
                }
                checked={snapshot.isActive}
                onChange={(value) => update('isActive', value)}
              />
              <ToggleCard
                title="Premium"
                description={
                  snapshot.isPremium
                    ? 'Solo accesible con suscripción activa'
                    : 'Disponible para todos los alumnos'
                }
                checked={snapshot.isPremium}
                onChange={(value) => update('isPremium', value)}
                tooltip="Si activás Premium, las lecciones que no marques como Gratis quedan bloqueadas para usuarios sin suscripción."
              />
            </div>
          </Section>

          {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>

        <footer className={styles.footer}>
          <span className={styles.footerStatus}>
            {saving ? <strong>Guardando...</strong> : draftSavedLabel ? <span>{draftSavedLabel}</span> : null}
          </span>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => void handleClose()}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => void submit()}
              disabled={!canSubmit}
              title={
                canSubmit
                  ? undefined
                  : 'Completá título, descripción y al menos una lección con título.'
              }
            >
              {saving
                ? mode === 'create'
                  ? 'Creando...'
                  : 'Guardando...'
                : mode === 'create'
                  ? 'Crear curso'
                  : 'Guardar cambios'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

type SectionProps = {
  id: SectionId;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  state: SectionState;
  open: boolean;
  onToggle: () => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
};

function Section({
  icon,
  title,
  subtitle,
  state,
  open,
  onToggle,
  headerExtra,
  children,
}: SectionProps) {
  const sectionClass =
    state === 'complete'
      ? styles.sectionDone
      : state === 'invalid'
        ? styles.sectionInvalid
        : '';
  const statusClass =
    state === 'complete'
      ? styles.sectionStatusDone
      : state === 'invalid'
        ? styles.sectionStatusError
        : '';

  function onHeaderKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <section className={`${styles.section} ${sectionClass}`}>
      <div
        className={styles.sectionHeader}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-section-toggle]')) {
            onToggle();
          }
        }}
        onKeyDown={onHeaderKeyDown}
      >
        <span
          data-section-toggle
          className={`${styles.sectionStatus} ${statusClass}`}
        >
          {state === 'complete' ? <Check size={14} /> : icon}
        </span>
        <div data-section-toggle className={styles.sectionTitle}>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        {headerExtra}
        <button
          type="button"
          className={styles.miniBtn}
          aria-label={open ? 'Contraer sección' : 'Expandir sección'}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <ChevronDown
            size={18}
            className={`${styles.sectionChevron} ${open ? styles.sectionChevronOpen : ''}`}
          />
        </button>
      </div>
      {open ? <div className={styles.sectionBody}>{children}</div> : null}
    </section>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
  tooltip,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  tooltip?: string;
}) {
  return (
    <button
      type="button"
      className={styles.toggleCard}
      onClick={() => onChange(!checked)}
      style={{ textAlign: 'left', width: '100%' }}
    >
      <div className={styles.toggleCardText}>
        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {title}
          {tooltip ? (
            <span className={styles.tooltipWrap}>
              <span className={styles.tooltipBtn} aria-hidden>
                <HelpCircle size={11} />
              </span>
              <span className={styles.tooltipText}>{tooltip}</span>
            </span>
          ) : null}
        </strong>
        <span>{description}</span>
      </div>
      <span className={`${styles.switch} ${checked ? styles.switchOn : ''}`}>
        <span className={styles.switchKnob} />
      </span>
    </button>
  );
}
