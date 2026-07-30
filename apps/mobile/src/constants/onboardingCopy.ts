import type { HookIconOption } from '../data/hooksFlow';
import type { ExperienceLevel, PlanHorizonDays } from '../types';

/** Banner verde en Q1–Q4 y pantallas de reflexión del diagnóstico. */
export const DIAGNOSTIC_STARTED_BANNER = 'Empezó tu diagnóstico…';

/** CTA por defecto en preguntas del diagnóstico (Q14 usa override propio). */
export const DIAGNOSTIC_QUESTION_PRIMARY_LABEL = 'Seguir diagnóstico';

export const RADAR_ONBOARDING_COPY = {
  title: 'Tu radar',
  subtitle: 'La fuerza de tu cerebro actual',
  caption: 'Resultado de tu diagnóstico',
  primaryLabel: 'Siguiente',
} as const;

export const HORIZON_SCREEN_COPY = {
  title: '¿En cuánto querés transformarte?',
  subtitle: 'Elegí el horizonte de tu plan de entrenamiento',
  primaryLabel: 'Siguiente',
} as const;

export type HorizonOption = HookIconOption & {
  days: PlanHorizonDays;
  recommended?: boolean;
  sideNote?: string;
};

export const HORIZON_OPTIONS: HorizonOption[] = [
  {
    id: '30',
    days: 30,
    label: '30 días',
    subtitle: '10 min/día · 30 módulos · 5 hs totales',
    sideNote: 'Empezá de a poco',
    icon: 'flash-outline',
    tileColor: '#FF5C7A',
    iconColor: '#FFFFFF',
  },
  {
    id: '60',
    days: 60,
    label: '60 días',
    subtitle: '10 min/día · 60 módulos · 10 hs totales',
    sideNote: 'RECOMENDADO',
    icon: 'rocket-outline',
    tileColor: '#B73CEF',
    iconColor: '#FFFFFF',
    recommended: true,
  },
  {
    id: '90',
    days: 90,
    label: '90 días',
    subtitle: '15 min/día · 90 módulos · 22 hs totales',
    sideNote: 'Para los que van con todo',
    icon: 'trophy-outline',
    tileColor: '#34D6C2',
    iconColor: '#1A0030',
  },
];

export const EXPERIENCE_LEVEL_SCREEN_COPY = {
  title: '¿En qué nivel estás?',
  subtitle: 'Así calibramos la intensidad de tu plan',
  primaryLabel: 'Siguiente',
} as const;

export const EXPERIENCE_LEVEL_OPTIONS: Array<
  HookIconOption & { level: ExperienceLevel }
> = [
  {
    id: 'beginner',
    level: 'beginner',
    label: 'Principiante',
    subtitle: 'Recién empiezo a desarrollar habilidades blandas',
    icon: 'school-outline',
    tileColor: '#34D6C2',
    iconColor: '#1A0030',
  },
  {
    id: 'intermediate',
    level: 'intermediate',
    label: 'Intermedio',
    subtitle: 'Tengo experiencia pero quiero profundizar',
    icon: 'stats-chart-outline',
    tileColor: '#B73CEF',
    iconColor: '#FFFFFF',
  },
  {
    id: 'advanced',
    level: 'advanced',
    label: 'Avanzado',
    subtitle: 'Soy líder y busco perfeccionar mi estilo',
    icon: 'ribbon-outline',
    tileColor: '#FF5C7A',
    iconColor: '#FFFFFF',
  },
];

export const CLOSURE_PRIMARY_LABEL = 'Crear cuenta para mi plan';

/** Textos del carrusel intro (slides 04–08). Fuente única para copy del cliente. */
export const CAROUSEL_SLIDE_COPY = {
  identificacion: {
    subtitle: 'La IA tampoco lo resuelve, necesita que tú entrenes.',
  },
  tension: {
    accent: 'Eso se entrena y te hace mejor.',
  },
  diferencial: {
    subtitle: 'Un sistema que se adapta a tu nivel, ritmo y objetivos profesionales.',
  },
  transformacion: {
    pre: 'Lo que entrenás todos los días termina definiendo',
    accent: 'quién te conviertes.',
    subtitle: 'Suelo entrenar de 15 a 30 minutos a la semana.',
  },
} as const;

/** Checklist explícito del primer loader (algoritmo de diagnóstico). */
export const LOADER_ANALYZING_TASKS = [
  'Respuestas de las 14 preguntas registradas',
  'Calculando tus 11 habilidades blandas',
  'Detectando fortalezas y áreas a entrenar',
] as const;
