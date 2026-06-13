import type { DiagnosticSkillId } from '../data/diagnostic';

/**
 * Algoritmo de scoring del diagnostico T2T:
 * - Q1-Q12 aportan score base por skill (val 1..5 -> 0..100).
 * - Q13 (autopercepcion) aplica un penalty cruzado a las skills del area
 *   que el usuario reporta como "necesita apoyo": medimos congruencia.
 * - Q14 (motivacion) no afecta scores, solo expone `focusAreas` para el insight.
 *
 * Se inyectan `skills` y `questions` para evitar un ciclo de import con
 * `data/diagnostic.ts` (este archivo solo importa el tipo, no los datos).
 */

export const Q13_PENALTY = 15;
export const Q13_GENERAL_PENALTY = 5;

/** Mapea cada opcion de Q13 (val 1..5) a las skills que penaliza. val 6 = "todas". */
export const Q13_AREA_TO_SKILLS: Record<number, DiagnosticSkillId[]> = {
  1: ['comunicacion', 'escucha', 'influencia'],
  2: ['liderazgo', 'liderazgoHumano', 'influencia'],
  3: ['productividad', 'resolucion'],
  4: ['gestionEmocional', 'resolucion', 'liderazgo'],
  5: ['adaptabilidad', 'aprendizaje', 'creatividad'],
};

/** Mapea cada opcion de Q14 (val 1..5) a las skills foco para el insight. */
export const Q14_MOTIVATION_TO_FOCUS: Record<number, DiagnosticSkillId[]> = {
  1: ['gestionEmocional'],
  2: ['influencia', 'comunicacion'],
  3: ['productividad', 'liderazgo'],
  4: ['liderazgo', 'liderazgoHumano', 'equipo'],
  5: ['gestionEmocional', 'aprendizaje', 'adaptabilidad'],
};

/** Convierte un valor 1..5 a score 0..100. */
export function valueToScore(value: number): number {
  const clamped = Math.max(1, Math.min(5, value));
  return Math.round(((clamped - 1) / 4) * 100);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type AdjustedScores = {
  baseScores: Record<string, number>;
  scores: Record<string, number>;
  focusAreas: string[];
};

export type SkillQuestionMeta = {
  id: string;
  skillId?: DiagnosticSkillId;
};

/**
 * Calcula los scores ajustados a partir de las respuestas.
 * - `baseScores`: solo Q1-Q12, sin ajustes.
 * - `scores`: con penalty Q13 aplicado (los que se usan en el radar).
 * - `focusAreas`: skills que el usuario quiere desarrollar segun Q14.
 */
export function computeAdjustedScores(
  answers: Record<string, number>,
  skills: readonly DiagnosticSkillId[],
  questions: readonly SkillQuestionMeta[],
): AdjustedScores {
  const baseScores: Record<string, number> = {};
  for (const skillId of skills) {
    const question = questions.find((q) => q.skillId === skillId);
    const value = question ? answers[question.id] : undefined;
    baseScores[skillId] = typeof value === 'number' ? valueToScore(value) : 50;
  }

  const scores: Record<string, number> = { ...baseScores };

  const q13 = answers['q13'];
  if (typeof q13 === 'number') {
    if (q13 === 6) {
      for (const skill of skills) {
        scores[skill] = clamp(scores[skill] - Q13_GENERAL_PENALTY, 0, 100);
      }
    } else {
      const targetSkills = Q13_AREA_TO_SKILLS[q13];
      if (targetSkills) {
        for (const skill of targetSkills) {
          scores[skill] = clamp(scores[skill] - Q13_PENALTY, 0, 100);
        }
      }
    }
  }

  const q14 = answers['q14'];
  const focusAreas =
    typeof q14 === 'number' && Q14_MOTIVATION_TO_FOCUS[q14]
      ? [...Q14_MOTIVATION_TO_FOCUS[q14]]
      : [];

  return { baseScores, scores, focusAreas };
}
