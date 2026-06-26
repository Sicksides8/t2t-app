'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  FileText,
  HelpCircle,
  ImageIcon,
  Info,
  ListChecks,
  Sparkles,
  X,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import {
  ACCESS_TIER_OPTIONS,
  LEVEL_OPTIONS,
  MOCK_VIDEO_URL,
  REQUIRED_PLAN_OPTIONS,
  SKILL_SUGGESTIONS,
  accessTierFromCourse,
  isMockVideoUrl,
  requiredPlanFromCourse,
} from '../../lib/courseConstants';
import { emptySkillImpact, resolveSkillId } from '../../lib/courseFields';
import type {
  Course,
  CourseDetailPayload,
  CreateCourseBody,
  LessonDraft,
  ModuleLink,
  SubtitleTrack,
  SyncCurriculumBody,
} from '../../types';
import { useToast } from '../ui/Toast';
import { LessonListEditor } from './LessonListEditor';
import { MediaUploader } from './MediaUploader';
import { SkillImpactGrid } from './SkillImpactGrid';
import { SkillTagsInput } from './SkillTagsInput';
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

type SectionId = 'course' | 'impact' | 'cover' | 'material' | 'lessons' | 'publish';

type SectionState = 'empty' | 'partial' | 'complete' | 'invalid';

const DEMO_SNAPSHOT: CourseFormSnapshot = {
  title: 'Liderazgo humano para equipos modernos',
  skillId: 'liderazgo',
  secondarySkillIds: ['comunicacion'],
  courseCode: '',
  order: 1,
  planOrder: '',
  skillImpact: emptySkillImpact(),
  description:
    'Aprende a liderar con confianza, claridad y conversaciones difíciles bien llevadas. Ideal para coordinadores y mandos medios que quieren acompañar mejor a sus equipos.',
  thumbnail: '',
  pdfUrl: '',
  level: 'beginner',
  accessTier: 'free',
  requiredPlan: 'free',
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

function emptySnapshot(nextOrder?: number): CourseFormSnapshot {
  return {
    title: '',
    skillId: '',
    secondarySkillIds: [],
    courseCode: '',
    order: typeof nextOrder === 'number' ? nextOrder : '',
    planOrder: '',
    skillImpact: emptySkillImpact(),
    description: '',
    thumbnail: '',
    pdfUrl: '',
    level: 'beginner',
    accessTier: 'free',
    requiredPlan: 'free',
    isActive: true,
    isPremium: false,
    lessons: [newLessonDraft(1), newLessonDraft(2)],
  };
}

function computeCourseSection(snapshot: CourseFormSnapshot): SectionState {
  const filled = [
    snapshot.title.trim(),
    snapshot.description.trim(),
    snapshot.skillId.trim(),
  ].filter(Boolean).length;
  if (filled === 0) return 'empty';
  if (filled === 3) return 'complete';
  return 'partial';
}

function computeCoverSection(snapshot: CourseFormSnapshot): SectionState {
  if (snapshot.thumbnail.trim()) return 'complete';
  return 'partial';
}

function computeLessonsSection(snapshot: CourseFormSnapshot): SectionState {
  if (snapshot.lessons.length === 0) return 'invalid';
  const hasInvalidTitle = snapshot.lessons.some((l) => !l.title.trim());
  if (hasInvalidTitle) return 'invalid';
  const hasInvalidVideo = snapshot.lessons.some(
    (l) => !l.videoUrl?.trim() || isMockVideoUrl(l.videoUrl),
  );
  if (hasInvalidVideo) return 'invalid';
  return 'complete';
}

function collectSubmitBlockers(snapshot: CourseFormSnapshot, uploadsBusy: boolean): string[] {
  const blockers: string[] = [];
  if (uploadsBusy) {
    blockers.push('Esperá a que terminen las subidas de archivos.');
  }
  if (!snapshot.title.trim()) blockers.push('Completá el título del curso.');
  if (!snapshot.skillId.trim()) blockers.push('Completá la categoría principal.');
  if (!snapshot.description.trim()) blockers.push('Completá la descripción del curso.');
  if (snapshot.lessons.length === 0) {
    blockers.push('Agregá al menos un módulo.');
    return blockers;
  }
  const noTitle = snapshot.lessons
    .map((l, i) => (!l.title.trim() ? i + 1 : null))
    .filter((n): n is number => n !== null);
  if (noTitle.length) {
    blockers.push(
      noTitle.length === 1
        ? `Falta el título del módulo ${noTitle[0]}.`
        : `Faltan títulos en los módulos: ${noTitle.join(', ')}.`,
    );
  }
  const noVideo = snapshot.lessons
    .map((l, i) => (!l.videoUrl?.trim() || isMockVideoUrl(l.videoUrl) ? i + 1 : null))
    .filter((n): n is number => n !== null);
  if (noVideo.length) {
    blockers.push(
      noVideo.length === 1
        ? `Subí el video del módulo ${noVideo[0]} (expandí el módulo).`
        : `Faltan videos en los módulos: ${noVideo.join(', ')} (expandí cada uno y subí el archivo).`,
    );
  }
  return blockers;
}

function courseIssueHint(snapshot: CourseFormSnapshot, state: SectionState): string | undefined {
  if (state === 'complete') return undefined;
  const missing: string[] = [];
  if (!snapshot.title.trim()) missing.push('título');
  if (!snapshot.skillId.trim()) missing.push('categoría principal');
  if (!snapshot.description.trim()) missing.push('descripción');
  if (missing.length === 0) return undefined;
  return `Falta: ${missing.join(', ')}.`;
}

function lessonsIssueHint(snapshot: CourseFormSnapshot, state: SectionState): string | undefined {
  if (state === 'complete') return undefined;
  if (snapshot.lessons.length === 0) return 'Agregá al menos un módulo.';
  const parts: string[] = [];
  const noTitle = snapshot.lessons.filter((l) => !l.title.trim()).length;
  const noVideo = snapshot.lessons.filter(
    (l) => !l.videoUrl?.trim() || isMockVideoUrl(l.videoUrl),
  ).length;
  if (noTitle) parts.push(`${noTitle} sin título`);
  if (noVideo) parts.push(`${noVideo} sin video`);
  return parts.length ? parts.join(' · ') : undefined;
}

function totalDurationMin(lessons: LessonDraft[]): number {
  return Math.max(1, Math.ceil(lessons.reduce((sum, l) => sum + (l.durationSec || 0), 0) / 60));
}

function snapshotsEqual(a: CourseFormSnapshot, b: CourseFormSnapshot): boolean {
  if (
    a.title !== b.title ||
    a.skillId !== b.skillId ||
    JSON.stringify(a.secondarySkillIds) !== JSON.stringify(b.secondarySkillIds) ||
    a.courseCode !== b.courseCode ||
    a.order !== b.order ||
    a.planOrder !== b.planOrder ||
    JSON.stringify(a.skillImpact) !== JSON.stringify(b.skillImpact) ||
    a.description !== b.description ||
    a.thumbnail !== b.thumbnail ||
    a.pdfUrl !== b.pdfUrl ||
    a.level !== b.level ||
    a.accessTier !== b.accessTier ||
    a.requiredPlan !== b.requiredPlan ||
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
      (la.pdfUrl || '') !== (lb.pdfUrl || '') ||
      la.durationSec !== lb.durationSec ||
      la.isFree !== lb.isFree ||
      la.order !== lb.order ||
      !linksEqual(la.links, lb.links) ||
      !subtitlesEqual(la.subtitles, lb.subtitles)
    ) {
      return false;
    }
  }
  return true;
}

function linksEqual(a?: ModuleLink[], b?: ModuleLink[]): boolean {
  const aa = a || [];
  const bb = b || [];
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i += 1) {
    if ((aa[i].url || '') !== (bb[i].url || '')) return false;
    if ((aa[i].label || '') !== (bb[i].label || '')) return false;
  }
  return true;
}

function subtitlesEqual(a?: SubtitleTrack[], b?: SubtitleTrack[]): boolean {
  const aa = a || [];
  const bb = b || [];
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i += 1) {
    if ((aa[i].lang || '') !== (bb[i].lang || '')) return false;
    if ((aa[i].label || '') !== (bb[i].label || '')) return false;
    if ((aa[i].url || '') !== (bb[i].url || '')) return false;
  }
  return true;
}

/**
 * Filtra subtítulos a enviar al backend: descarta entradas a medio cargar
 * (sin url o sin lang) y normaliza los strings.
 */
function cleanSubtitlesPayload(input?: SubtitleTrack[]): SubtitleTrack[] | undefined {
  if (!Array.isArray(input) || input.length === 0) return undefined;
  const cleaned = input
    .map((track) => ({
      lang: (track.lang || '').trim().toLowerCase(),
      label: (track.label || '').trim(),
      url: (track.url || '').trim(),
    }))
    .filter((track) => track.lang && track.url);
  return cleaned.length > 0 ? cleaned : undefined;
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
  const [uploadsBusy, setUploadsBusy] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const loadSeqRef = useRef(0);
  const uploadsBusyRef = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const hasScrolledBodyRef = useRef(false);

  const trackUploadBusy = useCallback((busy: boolean) => {
    uploadsBusyRef.current = Math.max(0, uploadsBusyRef.current + (busy ? 1 : -1));
    setUploadsBusy(uploadsBusyRef.current > 0);
  }, []);

  const dirty = useMemo(() => !snapshotsEqual(snapshot, initialSnapshot), [snapshot, initialSnapshot]);

  // Carga inicial / reset al abrir
  useEffect(() => {
    if (!open) return;
    setError(null);
    setOrphanUrls([]);
    setUploadsBusy(false);
    uploadsBusyRef.current = 0;
    setShowValidation(false);
    hasScrolledBodyRef.current = false;
    loadSeqRef.current += 1;
    const seq = loadSeqRef.current;

    if (mode === 'edit' && courseId) {
      setLoading(true);
      apiFetch<CourseDetailPayload>(`/api/admin/courses/${courseId}`)
        .then((data) => {
          if (loadSeqRef.current !== seq) return;
          const initial: CourseFormSnapshot = {
            title: data.course.title || '',
            skillId: data.course.skillId || '',
            secondarySkillIds: data.course.secondarySkillIds ?? [],
            courseCode: data.course.courseCode ?? '',
            order: typeof data.course.order === 'number' ? data.course.order : '',
            planOrder:
              data.course.planOrder === null
                ? null
                : typeof data.course.planOrder === 'number'
                  ? data.course.planOrder
                  : '',
            skillImpact: { ...emptySkillImpact(), ...(data.course.skillImpact ?? {}) },
            description: data.course.description || '',
            thumbnail: data.course.thumbnail || '',
            pdfUrl: data.course.pdfUrl || '',
            level: data.course.level || 'beginner',
            accessTier: accessTierFromCourse(data.course),
            requiredPlan: requiredPlanFromCourse(data.course),
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
      const fresh = emptySnapshot(nextOrder);
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
  }, [open, mode, courseId, scope, nextOrder]);

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
  const lessonsState = useMemo(() => computeLessonsSection(snapshot), [snapshot]);
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

  const formValid = courseState === 'complete' && lessonsState === 'complete';

  const canSubmit = formValid && !saving && !loading && !uploadsBusy;

  const submitBlockers = useMemo(
    () => collectSubmitBlockers(snapshot, uploadsBusy),
    [snapshot, uploadsBusy],
  );

  const courseHint = useMemo(
    () => (showValidation ? courseIssueHint(snapshot, courseState) : undefined),
    [showValidation, snapshot, courseState],
  );

  const lessonsHint = useMemo(
    () => (showValidation ? lessonsIssueHint(snapshot, lessonsState) : undefined),
    [showValidation, snapshot, lessonsState],
  );

  const revealValidation = useCallback(() => {
    if (courseState === 'complete' && lessonsState === 'complete') return;
    setShowValidation(true);
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (courseState !== 'complete') next.add('course');
      if (lessonsState !== 'complete') next.add('lessons');
      return next;
    });
  }, [courseState, lessonsState]);

  const handleBodyScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el || loading || showValidation || formValid) return;
    if (el.scrollTop > 8) hasScrolledBodyRef.current = true;
    if (!hasScrolledBodyRef.current) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 72;
    if (nearBottom) revealValidation();
  }, [loading, showValidation, formValid, revealValidation]);

  function handlePrimaryAction() {
    if (!formValid) {
      revealValidation();
      return;
    }
    if (!canSubmit) return;
    void submit();
  }

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
    const data = stored.data;
    setSnapshot({
      ...data,
      secondarySkillIds: data.secondarySkillIds ?? [],
      courseCode: data.courseCode ?? '',
      order: data.order ?? '',
      planOrder: data.planOrder ?? '',
      skillImpact: data.skillImpact ?? emptySkillImpact(),
      requiredPlan:
        data.requiredPlan ??
        requiredPlanFromCourse({ accessTier: data.accessTier, isPremium: data.isPremium }),
      lessons: data.lessons.map(lessonFromDraft),
    });
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
    const isPremiumDerived = snapshot.requiredPlan !== 'free';
    const orderNum =
      typeof snapshot.order === 'number' ? snapshot.order : Number(snapshot.order) || undefined;
    const planOrderRaw = snapshot.planOrder;
    const planOrder =
      planOrderRaw === null
        ? null
        : typeof planOrderRaw === 'number'
          ? planOrderRaw
          : planOrderRaw === ''
            ? undefined
            : Number(planOrderRaw) || undefined;
    const body: CreateCourseBody = {
      title: snapshot.title.trim(),
      skillId: resolveSkillId(snapshot.skillId.trim()),
      secondarySkillIds: snapshot.secondarySkillIds,
      courseCode: snapshot.courseCode.trim() || undefined,
      description: snapshot.description.trim(),
      thumbnail: snapshot.thumbnail.trim() || undefined,
      pdfUrl: snapshot.pdfUrl.trim() || undefined,
      level: snapshot.level,
      accessTier: snapshot.accessTier,
      requiredPlan: snapshot.requiredPlan,
      order: orderNum ?? (typeof nextOrder === 'number' ? nextOrder : undefined),
      planOrder,
      skillImpact: snapshot.skillImpact,
      isActive: snapshot.isActive,
      isPremium: isPremiumDerived,
      lessons: snapshot.lessons.map((lesson) => ({
        title: lesson.title.trim(),
        videoUrl: lesson.videoUrl.trim(),
        pdfUrl: lesson.pdfUrl?.trim() || undefined,
        links: lesson.links && lesson.links.length > 0 ? lesson.links : undefined,
        subtitles: cleanSubtitlesPayload(lesson.subtitles),
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
      const isPremiumDerived = snapshot.requiredPlan !== 'free';
      const orderNum =
        typeof snapshot.order === 'number' ? snapshot.order : Number(snapshot.order) || undefined;
      const planOrderRaw = snapshot.planOrder;
      const planOrder =
        planOrderRaw === null
          ? null
          : typeof planOrderRaw === 'number'
            ? planOrderRaw
            : planOrderRaw === ''
              ? undefined
              : Number(planOrderRaw) || undefined;
      await apiFetch<Course>(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: snapshot.title.trim(),
          skillId: resolveSkillId(snapshot.skillId.trim()),
          secondarySkillIds: snapshot.secondarySkillIds,
          courseCode: snapshot.courseCode.trim() || null,
          description: snapshot.description.trim(),
          thumbnail: snapshot.thumbnail.trim() || null,
          pdfUrl: snapshot.pdfUrl.trim() || null,
          level: snapshot.level,
          accessTier: snapshot.accessTier,
          requiredPlan: snapshot.requiredPlan,
          isActive: snapshot.isActive,
          isPremium: isPremiumDerived,
          order: orderNum,
          planOrder,
          skillImpact: snapshot.skillImpact,
        }),
      });

      const curriculum: SyncCurriculumBody = {
        lessons: snapshot.lessons.map((lesson, index) => ({
          id: lesson.id,
          title: lesson.title.trim(),
          videoUrl: lesson.videoUrl.trim(),
          pdfUrl: lesson.pdfUrl?.trim() || undefined,
          links: lesson.links && lesson.links.length > 0 ? lesson.links : undefined,
          subtitles: cleanSubtitlesPayload(lesson.subtitles),
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
                  ? 'Completá la información del curso y sus módulos. Se publica al guardar.'
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

        <div className={styles.body} ref={bodyRef} onScroll={handleBodyScroll}>
          {loading ? <p className={styles.hint}>Cargando curso...</p> : null}

          <Section
            id="course"
            icon={<Info size={18} />}
            title="Información del curso"
            subtitle="Cómo se llama y qué van a aprender"
            state={courseState}
            issueHint={courseHint}
            emphasizeValidation={showValidation}
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
                  className={`${styles.input} ${
                    showValidation && !snapshot.title.trim() ? styles.inputInvalid : ''
                  }`}
                  value={snapshot.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Ej: Liderazgo humano para equipos modernos"
                  maxLength={120}
                  required
                />
                {showValidation && !snapshot.title.trim() ? (
                  <span className={styles.errorText}>El título es obligatorio.</span>
                ) : null}
                <span className={styles.hint}>Lo que se ve grande en la card del catálogo (máx. 120).</span>
              </label>

              <label className={styles.label}>
                <span>Código de curso</span>
                <input
                  className={styles.input}
                  value={snapshot.courseCode}
                  onChange={(e) => update('courseCode', e.target.value.toUpperCase())}
                  placeholder="Ej: C1, C12"
                  maxLength={8}
                />
                <span className={styles.hint}>Opcional. Clave estable del catálogo (matriz Excel).</span>
              </label>

              <div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  Categoría principal <span className={styles.required}>*</span>
                </span>
                <p className={styles.hint} style={{ marginBottom: 8 }}>
                  Aparece como etiqueta principal en la app móvil.
                </p>
                <div className={styles.chips}>
                  {SKILL_SUGGESTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.chip} ${
                        snapshot.skillId === opt.value ? styles.chipActive : styles.chipGhost
                      }`}
                      onClick={() => update('skillId', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {showValidation && !snapshot.skillId.trim() ? (
                  <span className={styles.errorText}>La categoría principal es obligatoria.</span>
                ) : null}
              </div>

              <SkillTagsInput
                label="Habilidades entrenadas (tag secundario)"
                hint="Clasificación adicional. No define el impacto numérico en la araña."
                values={snapshot.secondarySkillIds}
                excludeIds={[snapshot.skillId].filter(Boolean)}
                onChange={(next) => update('secondarySkillIds', next)}
              />

              <div className={styles.fieldGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <label className={styles.label}>
                  <span>Orden en catálogo</span>
                  <input
                    type="number"
                    min={1}
                    className={styles.input}
                    value={snapshot.order}
                    onChange={(e) =>
                      update('order', e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                </label>
                <label className={styles.label}>
                  <span>Orden plan Beta</span>
                  <input
                    type="number"
                    min={1}
                    className={styles.input}
                    value={snapshot.planOrder === null ? '' : snapshot.planOrder}
                    onChange={(e) => {
                      const v = e.target.value;
                      update('planOrder', v === '' ? '' : Number(v));
                    }}
                  />
                  <span className={styles.hint}>Vacío = no incluido en plan fijo.</span>
                </label>
                <label className={styles.label}>
                  <span>Módulos</span>
                  <input
                    className={styles.input}
                    value={snapshot.lessons.length}
                    readOnly
                    disabled
                  />
                  <span className={styles.hint}>Calculado al guardar (totalLessons).</span>
                </label>
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
                  className={`${styles.textarea} ${
                    showValidation && !snapshot.description.trim() ? styles.inputInvalid : ''
                  }`}
                  value={snapshot.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Qué va a aprender el alumno y por qué le sirve. 2-3 oraciones."
                  maxLength={500}
                />
                {showValidation && !snapshot.description.trim() ? (
                  <span className={styles.errorText}>La descripción es obligatoria.</span>
                ) : null}
                <span className={styles.hint}>{snapshot.description.length}/500 caracteres.</span>
              </label>
            </div>
          </Section>

          <Section
            id="impact"
            icon={<HelpCircle size={18} />}
            title="Impacto en habilidades"
            subtitle="Actualiza la araña al completar el curso"
            state="partial"
            open={openSections.has('impact')}
            onToggle={() => toggleSection('impact')}
          >
            <SkillImpactGrid
              value={snapshot.skillImpact}
              onChange={(next) => update('skillImpact', next)}
            />
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
              onBusyChange={trackUploadBusy}
              onPrevReplaced={trackOrphan}
              onChange={(url) => update('thumbnail', url || '')}
            />
            <p className={styles.hint}>
              Recomendado: 1280x720 (16:9), foto clara con poco texto. Si lo dejás vacío, usamos un fondo
              degradado por defecto.
            </p>
          </Section>

          <Section
            id="material"
            icon={<FileText size={18} />}
            title="Material PDF del curso"
            subtitle="Opcional, ej. resumen general o syllabus"
            state={snapshot.pdfUrl ? 'complete' : 'partial'}
            open={openSections.has('material')}
            onToggle={() => toggleSection('material')}
          >
            <MediaUploader
              kind="pdf"
              value={snapshot.pdfUrl || undefined}
              scope={scope}
              onBusyChange={trackUploadBusy}
              onPrevReplaced={trackOrphan}
              onChange={(url) => update('pdfUrl', url || '')}
            />
            <p className={styles.hint}>
              También podés subir un PDF distinto en cada módulo (ej. ejercicios o material complementario).
            </p>
          </Section>

          <Section
            id="lessons"
            icon={<ListChecks size={18} />}
            title={`Módulos (${snapshot.lessons.length})`}
            subtitle={
              snapshot.lessons.length > 0
                ? `Duración total estimada: ${totalDurationMin(snapshot.lessons)} min`
                : 'Agregá al menos un módulo para publicar'
            }
            state={lessonsState}
            issueHint={lessonsHint}
            emphasizeValidation={showValidation}
            open={openSections.has('lessons')}
            onToggle={() => toggleSection('lessons')}
          >
            <LessonListEditor
              lessons={snapshot.lessons}
              onChange={(next) =>
                setSnapshot((prev) => ({
                  ...prev,
                  lessons: typeof next === 'function' ? next(prev.lessons) : next,
                }))
              }
              onAssetReplaced={trackOrphan}
              onUploadsBusyChange={trackUploadBusy}
              scope={scope}
              validateMedia
              showFieldHints={showValidation}
              disabled={saving}
            />
          </Section>

          <Section
            id="publish"
            icon={<Check size={18} />}
            title="Publicación y acceso"
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
            </div>

            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Tipo de curso <span className={styles.required}>*</span>
              </span>
              <p className={styles.hint} style={{ marginTop: 4 }}>
                Clasificación del contenido en el catálogo (Free, Lite o Premium).
              </p>
              <div className={styles.tierGrid}>
                {ACCESS_TIER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.tierCard} ${
                      snapshot.accessTier === opt.value ? styles.tierCardActive : ''
                    }`}
                    onClick={() => update('accessTier', opt.value)}
                  >
                    <span className={styles.tierCardLabel}>{opt.label}</span>
                    <span className={styles.tierCardHint}>{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Membresía requerida <span className={styles.required}>*</span>
              </span>
              <p className={styles.hint} style={{ marginTop: 4 }}>
                Qué suscripción necesita el alumno para ver este curso en la app.
              </p>
              <div className={styles.tierGrid}>
                {REQUIRED_PLAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.tierCard} ${
                      snapshot.requiredPlan === opt.value ? styles.tierCardActive : ''
                    }`}
                    onClick={() => update('requiredPlan', opt.value)}
                  >
                    <span className={styles.tierCardLabel}>{opt.label}</span>
                    <span className={styles.tierCardHint}>{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>

        <footer className={styles.footer}>
          <span className={styles.footerStatus}>
            {uploadsBusy ? (
              <strong>Esperá a que terminen las subidas...</strong>
            ) : saving ? (
              <strong>Guardando...</strong>
            ) : showValidation && !formValid && submitBlockers.length > 0 ? (
              <div className={styles.footerBlockers} role="status">
                <strong>Para {mode === 'create' ? 'crear' : 'guardar'} el curso:</strong>
                <ul>
                  {submitBlockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : draftSavedLabel ? (
              <span>{draftSavedLabel}</span>
            ) : null}
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
              className={`${styles.primaryBtn} ${!formValid && !saving && !loading && !uploadsBusy ? styles.primaryBtnInactive : ''}`}
              onClick={handlePrimaryAction}
              disabled={saving || loading || uploadsBusy}
              title={
                formValid
                  ? undefined
                  : showValidation
                    ? submitBlockers[0] ?? 'Completá los campos obligatorios.'
                    : 'Completá los campos obligatorios para continuar.'
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
  issueHint?: string;
  emphasizeValidation?: boolean;
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
  issueHint,
  emphasizeValidation = false,
  open,
  onToggle,
  headerExtra,
  children,
}: SectionProps) {
  const sectionClass =
    state === 'complete'
      ? styles.sectionDone
      : emphasizeValidation && state === 'invalid'
        ? styles.sectionInvalid
        : '';
  const statusClass =
    state === 'complete'
      ? styles.sectionStatusDone
      : emphasizeValidation && state === 'invalid'
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
          {issueHint ? <span className={styles.sectionIssueHint}>{issueHint}</span> : null}
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
