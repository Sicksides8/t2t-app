import { THINKING_FRAMES } from './penpotFrames';

/** Habilidad asociada a cada ítem del cuestionario (14 preguntas → 5 dimensiones). */
export type DiagnosticSkillId = 'liderazgo' | 'influencia' | 'adaptabilidad' | 'comunicacion' | 'productividad';

export const DIAGNOSTIC_SKILLS: DiagnosticSkillId[] = [
  'liderazgo',
  'influencia',
  'adaptabilidad',
  'comunicacion',
  'productividad',
];

const SKILL_LABELS: Record<DiagnosticSkillId, string> = {
  liderazgo: 'Liderazgo',
  influencia: 'Influencia',
  adaptabilidad: 'Adaptabilidad',
  comunicacion: 'Comunicación',
  productividad: 'Productividad',
};

export type DiagnosticQuestion = {
  id: string;
  penFrame: string;
  text: string;
  skillId: DiagnosticSkillId;
  dimensionLabel: string;
};

export const diagnosticQuestions: DiagnosticQuestion[] = [
  { id: 'q1', penFrame: '09_Q_Liderazgo', text: 'Lidero conversaciones difíciles con calma.', skillId: 'liderazgo', dimensionLabel: SKILL_LABELS.liderazgo },
  { id: 'q2', penFrame: '10_Q_Influencia', text: 'Influyo sin imponer mis ideas.', skillId: 'influencia', dimensionLabel: SKILL_LABELS.influencia },
  { id: 'q3', penFrame: '11_Q_Adaptabilidad', text: 'Me adapto rápido cuando cambian las prioridades.', skillId: 'adaptabilidad', dimensionLabel: SKILL_LABELS.adaptabilidad },
  { id: 'q4', penFrame: '12_Q_Comunicacion', text: 'Comunico con claridad incluso bajo presión.', skillId: 'comunicacion', dimensionLabel: SKILL_LABELS.comunicacion },
  { id: 'q5', penFrame: '13_Q_Comunicacion', text: 'Trabajo bien con personas de estilos distintos.', skillId: 'comunicacion', dimensionLabel: SKILL_LABELS.comunicacion },
  { id: 'q6', penFrame: '14_Q_Productividad', text: 'Resuelvo problemas sin quedarme trabado.', skillId: 'productividad', dimensionLabel: SKILL_LABELS.productividad },
  { id: 'q7', penFrame: '15_Q_Influencia', text: 'Propongo ideas nuevas con frecuencia.', skillId: 'influencia', dimensionLabel: SKILL_LABELS.influencia },
  { id: 'q8', penFrame: '16_Q_Comunicacion', text: 'Escucho antes de responder.', skillId: 'comunicacion', dimensionLabel: SKILL_LABELS.comunicacion },
  { id: 'q9', penFrame: '17_Q_Productividad', text: 'Organizo mi semana con foco.', skillId: 'productividad', dimensionLabel: SKILL_LABELS.productividad },
  { id: 'q10', penFrame: '18_Q_Adaptabilidad', text: 'Aprendo rápido de la práctica.', skillId: 'adaptabilidad', dimensionLabel: SKILL_LABELS.adaptabilidad },
  { id: 'q11', penFrame: '19_Q_Liderazgo', text: 'Cuido el lado humano del liderazgo.', skillId: 'liderazgo', dimensionLabel: SKILL_LABELS.liderazgo },
  { id: 'q12', penFrame: '20_Q_GestionEmocional', text: 'Gestiono mis emociones en momentos tensos.', skillId: 'adaptabilidad', dimensionLabel: 'Gestión emocional' },
  { id: 'q13', penFrame: '22_Q_Autopercepcion', text: 'Reconozco mis fortalezas y brechas.', skillId: 'liderazgo', dimensionLabel: 'Autopercepción' },
  { id: 'q14', penFrame: '23_Q_Motivacion', text: 'Mantengo la motivación cuando el proceso se vuelve difícil.', skillId: 'productividad', dimensionLabel: 'Motivación' },
];

/** Índice de q12 tras el cual mostrar 21_T_Reflexion_Q12 */
export const REFLEXION_AFTER_QUESTION_INDEX = 11;

/** Pantallas thinking Penpot 21, 24–29 (7 pasos). */
export const onboardingThinkingFrames = THINKING_FRAMES;

export function computeDiagnosticScores(answers: Record<string, number>) {
  const scores = DIAGNOSTIC_SKILLS.reduce<Record<string, number>>((acc, skillId) => {
    const values = diagnosticQuestions
      .filter((q) => q.skillId === skillId)
      .map((q) => answers[q.id])
      .filter((v): v is number => typeof v === 'number');
    acc[skillId] = values.length
      ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 20)
      : 50;
    return acc;
  }, {});

  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const overallScore = Math.round(Object.values(scores).reduce((sum, v) => sum + v, 0) / DIAGNOSTIC_SKILLS.length);

  return {
    scores,
    topSkills: ordered.slice(0, 3).map(([skill]) => skill),
    weakSkills: ordered.slice(-2).map(([skill]) => skill),
    overallScore,
  };
}
