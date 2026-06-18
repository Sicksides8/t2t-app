import type { CourseAccessTier, CourseLevel, CourseRequiredPlan } from '../types';
import { getPlanDisplayName } from './planDisplay';

/** Mismo mock que apps/mobile y firebase/scripts/seed-t2t.mjs */
export const MOCK_VIDEO_URL =
  'https://pub-cbb826460242448e83ebe8b4ed4e375e.r2.dev/t2t-video-mock.mp4';

export function isMockVideoUrl(url?: string | null): boolean {
  const trimmed = (url || '').trim();
  return !trimmed || trimmed === MOCK_VIDEO_URL || trimmed.includes('t2t-video-mock.mp4');
}

/**
 * Sugerencias para el campo libre de habilidad/categoría.
 * El creador puede escribir cualquier valor, estas son solo atajos rápidos.
 */
export const SKILL_SUGGESTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'liderazgo', label: 'Liderazgo' },
  { value: 'influencia', label: 'Influencia' },
  { value: 'adaptabilidad', label: 'Adaptabilidad' },
  { value: 'comunicacion', label: 'Comunicacion' },
  { value: 'productividad', label: 'Productividad' },
];

/** Compatibilidad con el código existente (no es un union cerrado). */
export const SKILL_OPTIONS = SKILL_SUGGESTIONS;

/**
 * Niveles del alumno objetivo del curso.
 * Reemplaza la escala anterior (beginner/intermediate/advanced) por la nueva
 * trama del producto: principiante / maestro / experto.
 * Mantenemos los legacy values en el union para no romper datos viejos.
 */
export const LEVEL_OPTIONS: ReadonlyArray<{ value: CourseLevel; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'master', label: 'Master' },
  { value: 'expert', label: 'Expert' },
];

export const LEGACY_LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  master: 'Master',
  expert: 'Expert',
};

/**
 * Tipo de curso (clasificación del contenido en el catálogo).
 * No define por sí solo qué suscripción puede verlo — eso va en `requiredPlan`.
 */
export const ACCESS_TIER_OPTIONS: ReadonlyArray<{
  value: CourseAccessTier;
  label: string;
  hint: string;
}> = [
  { value: 'free', label: 'Free', hint: 'Curso base del catálogo.' },
  { value: 'lite', label: 'Lite', hint: 'Contenido intermedio.' },
  { value: 'premium', label: 'Premium', hint: 'Contenido exclusivo de alta gama.' },
];

export const ACCESS_TIER_LABEL: Record<CourseAccessTier, string> = {
  free: 'Free',
  lite: 'Lite',
  premium: 'Premium',
};

/**
 * Suscripción mínima para acceder al curso en la app.
 * IDs internos free | pro | elite — UI: Open | Pro | Black.
 */
export const REQUIRED_PLAN_OPTIONS: ReadonlyArray<{
  value: CourseRequiredPlan;
  label: string;
  hint: string;
}> = [
  { value: 'free', label: getPlanDisplayName('free'), hint: 'Visible para usuarios Open (y superiores).' },
  { value: 'pro', label: getPlanDisplayName('pro'), hint: 'Requiere suscripción Pro o Black.' },
  { value: 'elite', label: getPlanDisplayName('elite'), hint: 'Solo para suscripción Black.' },
];

export const REQUIRED_PLAN_LABEL: Record<CourseRequiredPlan, string> = {
  free: getPlanDisplayName('free'),
  pro: getPlanDisplayName('pro'),
  elite: getPlanDisplayName('elite'),
};

/** Fallback para cursos legacy sin `requiredPlan` persistido. */
export function requiredPlanFromCourse(course: {
  requiredPlan?: CourseRequiredPlan;
  accessTier?: CourseAccessTier;
  isPremium?: boolean;
}): CourseRequiredPlan {
  if (course.requiredPlan && ['free', 'pro', 'elite'].includes(course.requiredPlan)) {
    return course.requiredPlan;
  }
  const tier = course.accessTier ?? (course.isPremium ? 'lite' : 'free');
  if (tier === 'premium') return 'elite';
  if (tier === 'lite') return 'pro';
  return 'free';
}

/** Fallback para cursos legacy sin `accessTier` persistido. */
export function accessTierFromCourse(course: {
  accessTier?: CourseAccessTier;
  isPremium?: boolean;
}): CourseAccessTier {
  if (course.accessTier) return course.accessTier;
  return course.isPremium ? 'lite' : 'free';
}

export const DEFAULT_MODULE_TITLE = 'Modulo 1: contenido del curso';
