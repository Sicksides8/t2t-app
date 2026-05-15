/** Mismo mock que apps/mobile y firebase/scripts/seed-t2t.mjs */
export const MOCK_VIDEO_URL =
  'https://pub-cbb826460242448e83ebe8b4ed4e375e.r2.dev/t2t-video-mock.mp4';

export const SKILL_OPTIONS = [
  { value: 'liderazgo', label: 'Liderazgo' },
  { value: 'influencia', label: 'Influencia' },
  { value: 'adaptabilidad', label: 'Adaptabilidad' },
  { value: 'comunicacion', label: 'Comunicacion' },
  { value: 'productividad', label: 'Productividad' },
] as const;

export const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
] as const;

export const DEFAULT_MODULE_TITLE = 'Modulo 1: contenido del curso';
