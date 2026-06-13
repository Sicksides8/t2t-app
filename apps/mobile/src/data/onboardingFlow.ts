/**
 * Datos del carrusel onboarding rediseñado (04 → 31).
 * - carouselSlides: 5 story slides (04_Impacto … 08_Transformacion).
 * - ACTION_FRAME: 09_Accion (transición pre-diagnóstico con chips + 2 CTAs).
 * - OPENER_FRAME: 10_InicioDiagnostico (apertura handwritten).
 * - reflectionFrames: 3 reflexiones intercaladas (15, 21, 27).
 * - progressLoaderFrames: 4 loaders intercalados (16, 22, 28, 31).
 *
 * Las 14 preguntas viven en `data/diagnostic.ts`.
 */

export type CarouselSection =
  | { kind: 'pre'; text: string }
  | { kind: 'hero'; text: string }
  | { kind: 'subtitle'; text: string; divider?: boolean }
  | { kind: 'accent'; text: string }
  | { kind: 'body'; text: string };

export type CarouselSlide = {
  id: string;
  penFrame: string;
  sections: CarouselSection[];
};

export const carouselSlides: CarouselSlide[] = [
  {
    id: 'impacto',
    penFrame: '04_Impacto',
    sections: [
      { kind: 'hero', text: 'El mundo laboral cambió.' },
      { kind: 'subtitle', text: 'Y la mayoría todavía no lo entendió.', divider: true },
      { kind: 'body', text: 'Entrena las habilidades que van a definir tu futuro profesional.' },
    ],
  },
  {
    id: 'identificacion',
    penFrame: '05_Identificacion',
    sections: [
      { kind: 'hero', text: 'La universidad te da conocimientos.' },
      { kind: 'body', text: 'La IA tampoco te lo resuelve: necesita que te entrenes.' },
    ],
  },
  {
    id: 'tension',
    penFrame: '06_Tension',
    sections: [
      { kind: 'pre', text: 'Hoy la diferencia ya no está en lo que sabes.' },
      { kind: 'hero', text: 'Está en cómo piensas y trabajas con otros.' },
      { kind: 'accent', text: 'Eso se entrena y se mejora.' },
    ],
  },
  {
    id: 'diferencial',
    penFrame: '07_Diferencial',
    sections: [
      { kind: 'pre', text: 'YouTube tiene videos.' },
      { kind: 'hero', text: 'T2T tiene tu plan de entrenamiento.' },
      { kind: 'subtitle', text: 'Un sistema que se adapta a tu nivel, ritmo y objetivos profesionales.', divider: true },
      { kind: 'body', text: 'Solo invertirás 15-30 minutos por semana.' },
    ],
  },
  {
    id: 'transformacion',
    penFrame: '08_Transformacion',
    sections: [
      { kind: 'pre', text: 'Lo que entrenas todos los días' },
      { kind: 'pre', text: 'termina definiendo' },
      { kind: 'accent', text: 'quién te conviertes.' },
    ],
  },
];

export type ActionChip = {
  icon: 'help-circle' | 'time-outline';
  value: string;
  label: string;
};

export const ACTION_FRAME = {
  id: 'action',
  penFrame: '09_Accion',
  hero: 'Vamos a construir tu perfil profesional.',
  body: 'Sin respuestas correctas. Solo una mirada honesta a cómo entrenas hoy.',
  chips: [
    { icon: 'help-circle', value: '14', label: 'preguntas' },
    { icon: 'time-outline', value: '3', label: 'minutos' },
  ] as ActionChip[],
  primaryLabel: 'Empezar diagnóstico',
  ghostLabel: 'Saltar por ahora',
} as const;

export const OPENER_FRAME = {
  id: 'opener',
  penFrame: '10_InicioDiagnostico',
  script: 'Diagnóstico',
  subtitle: 'Tu punto de partida',
  hero: '¿Quieres saber cómo estás entrenando hoy?',
  primaryLabel: 'Comenzar',
} as const;

export type ReflectionFrame = {
  id: string;
  penFrame: string;
  label: string;
  body: string;
  /** Texto opcional verde grande (acento) — ej 15_T_Reflexion_Q4. */
  accentHero?: string;
  /** Texto opcional blanco bold grande — ej 21_T_Reflexion_Q8. */
  hero?: string;
};

export const reflectionFrames: ReflectionFrame[] = [
  {
    id: 'reflection-q4',
    penFrame: '15_T_Reflexion_Q4',
    label: 'Reflexión',
    body: 'La mayoría entrena habilidades técnicas.',
    accentHero: 'Muy pocos entrenan cómo pensar, liderar y adaptarse.',
  },
  {
    id: 'reflection-q8',
    penFrame: '21_T_Reflexion_Q8',
    label: 'Tiempo',
    body: 'Las habilidades técnicas cambian rápido. Las habilidades humanas llevan años.',
    hero: 'Por eso empezar hoy importa.',
  },
  {
    id: 'reflection-q12',
    penFrame: '27_T_Reflexion_Q12',
    label: 'Tu futuro',
    body: 'Tu carrera puede abrirte una puerta.',
    hero: 'Lo que hagas después depende de tus habilidades.',
  },
];

export type LoaderTaskState = 'done' | 'inProgress' | 'pending';
export type LoaderTask = { label: string; state: LoaderTaskState };

export type LoaderTint = 'purple' | 'teal' | 'green';
export type LoaderIconKey = 'sparkles' | 'radar' | 'layers' | 'barbell';

export type ProgressLoaderFrame = {
  id: string;
  penFrame: string;
  iconKey: LoaderIconKey;
  tint: LoaderTint;
  /** Título blanco arriba del accent. */
  title: string;
  /** Línea con accent color (verde/morado). */
  accent: string;
  /** Porcentaje de la barra (0-100). */
  percent: number;
  /** Caption "Texto · NN%". */
  statusLabel: string;
  /** Checklist (3 items con su estado). */
  tasks: [LoaderTask, LoaderTask, LoaderTask];
};

export const progressLoaderFrames: ProgressLoaderFrame[] = [
  {
    id: 'loader-analizando',
    penFrame: '16_T_Analizando',
    iconKey: 'sparkles',
    tint: 'purple',
    title: 'Analizando cómo entrenas hoy',
    accent: 'tus habilidades',
    percent: 33,
    statusLabel: 'Analizando tus elecciones',
    tasks: [
      { label: 'Respuestas registradas', state: 'done' },
      { label: 'Detectando patrones', state: 'inProgress' },
      { label: 'Construyendo tu perfil', state: 'pending' },
    ],
  },
  {
    id: 'loader-detectando',
    penFrame: '22_T_Detectando',
    iconKey: 'radar',
    tint: 'teal',
    title: 'Detectando fortalezas',
    accent: 'y puntos ciegos',
    percent: 67,
    statusLabel: 'Detectando patrones',
    tasks: [
      { label: 'Respuestas registradas', state: 'done' },
      { label: 'Detectando patrones', state: 'done' },
      { label: 'Construyendo tu perfil', state: 'inProgress' },
    ],
  },
  {
    id: 'loader-construyendo',
    penFrame: '28_T_Construyendo_Perfil',
    iconKey: 'layers',
    tint: 'purple',
    title: 'Construyendo',
    accent: 'tu perfil profesional',
    percent: 83,
    statusLabel: 'Construyendo tu perfil',
    tasks: [
      { label: 'Respuestas registradas', state: 'done' },
      { label: 'Patrones detectados', state: 'done' },
      { label: 'Generando tu perfil', state: 'inProgress' },
    ],
  },
  {
    id: 'loader-entrenamiento',
    penFrame: '31_T_Loading_Entrenamiento',
    iconKey: 'barbell',
    tint: 'green',
    title: 'Construyendo',
    accent: 'tu entrenamiento',
    percent: 100,
    statusLabel: 'Casi listo',
    tasks: [
      { label: 'Perfil generado', state: 'done' },
      { label: 'Plan personalizado', state: 'done' },
      { label: 'Listo para empezar', state: 'inProgress' },
    ],
  },
];
