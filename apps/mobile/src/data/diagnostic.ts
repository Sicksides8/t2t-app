import { THINKING_FRAMES } from './penpotFrames';

/**
 * Modelo de diagnóstico T2T (rediseño 04→32):
 * - 12 habilidades visibles en el radar (32_Resultado_Radar).
 * - 14 preguntas: 12 mapean 1-a-1 a una skill, 2 son meta (autopercepción + motivación).
 * - Cada pregunta presenta 5 (ó 6 en Q13) opciones de texto distintas. La posición
 *   de la opción seleccionada determina el valor 1-5 que aporta al score de la skill.
 */

export type DiagnosticSkillId =
  | 'liderazgo'
  | 'influencia'
  | 'adaptabilidad'
  | 'comunicacion'
  | 'equipo'
  | 'resolucion'
  | 'creatividad'
  | 'escucha'
  | 'productividad'
  | 'aprendizaje'
  | 'liderazgoHumano'
  | 'gestionEmocional';

export type DiagnosticMetaId = 'autopercepcion' | 'motivacion';

/** Orden visible en el radar (sentido horario desde arriba). */
export const DIAGNOSTIC_SKILLS: DiagnosticSkillId[] = [
  'liderazgo',
  'influencia',
  'adaptabilidad',
  'comunicacion',
  'equipo',
  'resolucion',
  'creatividad',
  'escucha',
  'productividad',
  'aprendizaje',
  'liderazgoHumano',
  'gestionEmocional',
];

export const SKILL_LABELS: Record<DiagnosticSkillId, string> = {
  liderazgo: 'Liderazgo',
  influencia: 'Influencia',
  adaptabilidad: 'Adaptabilidad',
  comunicacion: 'Comunicación',
  equipo: 'Trabajo en equipo',
  resolucion: 'Resolución de problemas',
  creatividad: 'Creatividad',
  escucha: 'Escucha',
  productividad: 'Productividad',
  aprendizaje: 'Aprendizaje',
  liderazgoHumano: 'Liderazgo humano',
  gestionEmocional: 'Gestión emocional',
};

/** Labels cortos para mostrar dentro del radar (espacio limitado). */
export const SKILL_LABELS_SHORT: Record<DiagnosticSkillId, string> = {
  liderazgo: 'Liderazgo',
  influencia: 'Influencia',
  adaptabilidad: 'Adaptabil.',
  comunicacion: 'Comunic.',
  equipo: 'Equipo',
  resolucion: 'Resolución',
  creatividad: 'Creatividad',
  escucha: 'Escucha',
  productividad: 'Productiv.',
  aprendizaje: 'Aprendiz.',
  liderazgoHumano: 'Lid. Hum.',
  gestionEmocional: 'Gest. Em.',
};

export const META_LABELS: Record<DiagnosticMetaId, string> = {
  autopercepcion: 'Autopercepción',
  motivacion: 'Motivación',
};

export type DiagnosticOption = {
  /** 1..5 para preguntas de skill (mapea al score). 1..6 sólo en Q13 (meta). */
  value: number;
  label: string;
};

export type DiagnosticQuestion = {
  id: string;
  /** Frame Penpot del pencil correspondiente. */
  penFrame: string;
  /** Etiqueta uppercase verde sobre la pregunta (ej "LIDERAZGO"). */
  category: string;
  /** Pregunta hero. */
  text: string;
  options: DiagnosticOption[];
  /** Skill que recibe el score. Ausente para meta. */
  skillId?: DiagnosticSkillId;
  /** Marca preguntas meta (Q13, Q14). */
  metaId?: DiagnosticMetaId;
  /** Texto verde opcional debajo de la barra de progreso (Q12-Q14). */
  hint?: string;
  /** Etiqueta CTA personalizada (Q14 dice "Ver mi diagnóstico"). */
  primaryLabel?: string;
};

const fiveOptions = (labels: [string, string, string, string, string]): DiagnosticOption[] =>
  labels.map((label, i) => ({ value: i + 1, label }));

export const diagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: 'q1',
    penFrame: '11_Q_Liderazgo',
    category: 'LIDERAZGO',
    text: 'Cuando trabajas con otras personas, normalmente…',
    skillId: 'liderazgo',
    options: fiveOptions([
      'Prefiero enfocarme en mi parte',
      'Participo cuando me lo piden',
      'Intento ayudar a organizar al equipo',
      'Me gusta impulsar ideas y motivar al grupo',
      'Disfruto liderar y hacer crecer a otros',
    ]),
  },
  {
    id: 'q2',
    penFrame: '12_Q_Influencia',
    category: 'INFLUENCIA',
    text: 'Cuando quieres convencer a alguien de una idea…',
    skillId: 'influencia',
    options: fiveOptions([
      'Voy directo y espero que funcione',
      'Explico lo básico y respondo dudas',
      'Intento adaptar mi mensaje según la persona',
      'Preparo ejemplos y argumentos sólidos',
      'Busco inspirar y generar compromiso real',
    ]),
  },
  {
    id: 'q3',
    penFrame: '13_Q_Adaptabilidad',
    category: 'ADAPTABILIDAD',
    text: 'Cuando entras a un lugar nuevo (trabajo, equipo o proyecto)…',
    skillId: 'adaptabilidad',
    options: fiveOptions([
      'Espero instrucciones claras',
      'Me adapto lentamente',
      'Observo y aprendo rápido',
      'Intento mejorar cosas desde el inicio',
      'Me entusiasma generar cambios y aportar ideas',
    ]),
  },
  {
    id: 'q4',
    penFrame: '14_Q_Comunicacion',
    category: 'COMUNICACIÓN',
    text: 'En reuniones o conversaciones grupales…',
    skillId: 'comunicacion',
    options: fiveOptions([
      'Prefiero no participar demasiado',
      'Hablo solo cuando estoy seguro',
      'Escucho y participo cuando puedo aportar',
      'Me involucro activamente en la conversación',
      'Ayudo a ordenar ideas y hacer avanzar la discusión',
    ]),
  },
  {
    id: 'q5',
    penFrame: '17_Q_TrabajoEquipo',
    category: 'TRABAJO EN EQUIPO',
    text: 'Trabajar con otras personas para ti suele ser…',
    skillId: 'equipo',
    options: fiveOptions([
      'Más difícil que trabajar solo',
      'Algo necesario, aunque incómodo',
      'Una oportunidad para aprender',
      'Una forma de mejorar resultados',
      'Una de las cosas que más disfruto',
    ]),
  },
  {
    id: 'q6',
    penFrame: '18_Q_Resolucion',
    category: 'RESOLUCIÓN DE PROBLEMAS',
    text: 'Cuando aparece un problema complejo…',
    skillId: 'resolucion',
    options: fiveOptions([
      'Busco resolverlo rápido y seguir',
      'Analizo lo básico antes de actuar',
      'Comparo distintas opciones',
      'Intento entender la raíz del problema',
      'Busco construir soluciones duraderas y escalables',
    ]),
  },
  {
    id: 'q7',
    penFrame: '19_Q_Creatividad',
    category: 'CREATIVIDAD',
    text: 'Cuando algo no funciona…',
    skillId: 'creatividad',
    options: fiveOptions([
      'Repito lo que ya conozco',
      'Cambio pequeños detalles',
      'Busco ideas diferentes',
      'Investigo nuevas formas de resolverlo',
      'Disfruto experimentar y probar caminos nuevos',
    ]),
  },
  {
    id: 'q8',
    penFrame: '20_Q_Escucha',
    category: 'ESCUCHA',
    text: 'Cuando alguien te está hablando…',
    skillId: 'escucha',
    options: fiveOptions([
      'Pienso en qué voy a responder',
      'Escucho solo lo importante',
      'Intento prestar atención real',
      'Adapto mi respuesta según lo que escucho',
      'Busco entender profundamente antes de responder',
    ]),
  },
  {
    id: 'q9',
    penFrame: '23_Q_Productividad',
    category: 'PRODUCTIVIDAD',
    text: 'Cuando tienes muchas cosas al mismo tiempo…',
    skillId: 'productividad',
    options: fiveOptions([
      'Resuelvo lo urgente primero',
      'Intento organizarme sobre la marcha',
      'Priorizo tareas importantes',
      'Uso sistemas o herramientas para ordenar mi trabajo',
      'Optimizo procesos para ahorrar tiempo y energía',
    ]),
  },
  {
    id: 'q10',
    penFrame: '24_Q_Aprendizaje',
    category: 'APRENDIZAJE',
    text: 'Fuera de la universidad o el trabajo…',
    skillId: 'aprendizaje',
    options: fiveOptions([
      'Casi no dedico tiempo a aprender cosas nuevas',
      'Consumo contenido de vez en cuando',
      'Busco aprender sobre temas específicos',
      'Tengo hábitos de aprendizaje constantes',
      'Invierto activamente en mi crecimiento personal y profesional',
    ]),
  },
  {
    id: 'q11',
    penFrame: '25_Q_LiderazgoHumano',
    category: 'LIDERAZGO HUMANO',
    text: 'Cuando alguien del equipo se equivoca…',
    skillId: 'liderazgoHumano',
    options: fiveOptions([
      'Prefiero no involucrarme',
      'Marco el error para que no vuelva a pasar',
      'Intento ayudar a resolverlo',
      'Busco entender qué pasó y acompañar',
      'Transformo el error en una oportunidad de aprendizaje',
    ]),
  },
  {
    id: 'q12',
    penFrame: '26_Q_GestionEmocional',
    category: 'GESTIÓN EMOCIONAL',
    text: 'Cuando trabajas bajo presión…',
    skillId: 'gestionEmocional',
    hint: 'Solo te faltan 2 preguntas',
    options: fiveOptions([
      'Me bloqueo fácilmente',
      'Me cuesta mantener el foco',
      'Logro resolver lo importante',
      'Mantengo la calma y priorizo',
      'Rindo bien incluso en situaciones exigentes',
    ]),
  },
  {
    id: 'q13',
    penFrame: '29_Q_Autopercepcion',
    category: 'AUTOPERCEPCIÓN',
    text: '¿Dónde sientes que hoy necesitas más apoyo?',
    metaId: 'autopercepcion',
    hint: 'Solo te falta 1 pregunta',
    options: [
      { value: 1, label: 'Comunicación' },
      { value: 2, label: 'Liderazgo' },
      { value: 3, label: 'Organización y productividad' },
      { value: 4, label: 'Confianza y toma de decisiones' },
      { value: 5, label: 'Adaptación y crecimiento profesional' },
      { value: 6, label: 'Un poco de todo' },
    ],
  },
  {
    id: 'q14',
    penFrame: '30_Q_Motivacion',
    category: 'MOTIVACIÓN',
    text: '¿Qué te gustaría lograr en los próximos años?',
    metaId: 'motivacion',
    hint: 'Última pregunta · ¡ya casi!',
    primaryLabel: 'Ver mi diagnóstico',
    options: fiveOptions([
      'Sentirme más seguro profesionalmente',
      'Conseguir mejores oportunidades',
      'Destacarme en mi trabajo o carrera',
      'Liderar proyectos o equipos',
      'Construir una versión más fuerte de mí mismo',
    ]),
  },
];

/** Índice tras el cual mostrar la 1ra reflexión (15_T_Reflexion_Q4). */
export const REFLEXION_AFTER_QUESTION_INDEX = 3;

/** Pantallas thinking heredadas (mantenido por compatibilidad — no usado en flujo nuevo). */
export const onboardingThinkingFrames = THINKING_FRAMES;

import { computeAdjustedScores } from '../utils/diagnosticAlgorithm';

export function computeDiagnosticScores(answers: Record<string, number>) {
  const { scores, baseScores, focusAreas } = computeAdjustedScores(
    answers,
    DIAGNOSTIC_SKILLS,
    diagnosticQuestions,
  );

  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const overallScore = Math.round(
    Object.values(scores).reduce((sum, v) => sum + v, 0) / DIAGNOSTIC_SKILLS.length,
  );

  return {
    scores,
    baseScores,
    focusAreas,
    topSkills: ordered.slice(0, 3).map(([skill]) => skill),
    weakSkills: ordered.slice(-2).map(([skill]) => skill),
    overallScore,
  };
}
