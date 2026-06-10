import type { CourseAccessTier, CourseLevel } from '../types';

/** Mismo mock que apps/mobile y firebase/scripts/seed-t2t.mjs */
export const MOCK_VIDEO_URL =
  'https://pub-cbb826460242448e83ebe8b4ed4e375e.r2.dev/t2t-video-mock.mp4';

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
 * Tipo de acceso del curso. Determina qué suscripción permite verlo en la app.
 * - free: visible para cualquier alumno (incluso plan Open).
 * - lite: requiere plan Pro o superior.
 * - premium: requiere plan Black.
 */
export const ACCESS_TIER_OPTIONS: ReadonlyArray<{
  value: CourseAccessTier;
  label: string;
  hint: string;
}> = [
  { value: 'free', label: 'Free', hint: 'Visible para todos los alumnos.' },
  { value: 'lite', label: 'Lite', hint: 'Requiere plan Pro o superior.' },
  { value: 'premium', label: 'Premium', hint: 'Solo para plan Black.' },
];

export const ACCESS_TIER_LABEL: Record<CourseAccessTier, string> = {
  free: 'Free',
  lite: 'Lite',
  premium: 'Premium',
};

export const DEFAULT_MODULE_TITLE = 'Modulo 1: contenido del curso';
