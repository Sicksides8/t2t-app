import type { DiagnosticSkillId } from '../data/diagnostic';

/**
 * Scoring del diagnóstico T2T (14 preguntas → 11 habilidades).
 *
 * Respuestas de skill en escala 2–10 (opciones 2, 4, 6, 8, 10).
 * Resultado de fórmula en 2–10, normalizado a 0–100 para el radar.
 *
 * P13 = Autopercepción categórica (1–6 → mapeo a escala de fórmula).
 * P14 = Motivación (2–10). Sin respuesta → valor neutro 6.
 */

export type FormulaTerm = { p: number; weight: number };

export type SkillFormulaDef = {
  terms: FormulaTerm[];
  /** Divisor fijo de la fórmula Excel (modo completo con meta). */
  divisor: number;
};

/** Fórmulas replicadas desde la tabla de autotest (Excel). */
export const SKILL_FORMULAS: Record<DiagnosticSkillId, SkillFormulaDef> = {
  liderazgo: {
    terms: [
      { p: 1, weight: 3 },
      { p: 2, weight: 1 },
      { p: 3, weight: 1 },
      { p: 8, weight: 1 },
      { p: 9, weight: 1 },
      { p: 11, weight: 2 },
      { p: 14, weight: 1 },
    ],
    divisor: 10,
  },
  influencia: {
    terms: [
      { p: 2, weight: 3 },
      { p: 3, weight: 1 },
      { p: 4, weight: 1 },
      { p: 12, weight: 1 },
      { p: 14, weight: 1 },
    ],
    divisor: 7,
  },
  adaptabilidad: {
    terms: [
      { p: 3, weight: 2 },
      { p: 2, weight: 1 },
      { p: 13, weight: 2 },
      { p: 5, weight: 1 },
      { p: 8, weight: 1 },
    ],
    divisor: 7,
  },
  comunicacion: {
    terms: [
      { p: 4, weight: 3 },
      { p: 2, weight: 1 },
      { p: 7, weight: 1 },
      { p: 8, weight: 1 },
      { p: 12, weight: 1 },
    ],
    divisor: 7,
  },
  equipo: {
    terms: [
      { p: 5, weight: 2 },
      { p: 4, weight: 1 },
      { p: 8, weight: 1 },
      { p: 10, weight: 1 },
      { p: 12, weight: 1 },
      { p: 11, weight: 1 },
      { p: 13, weight: 1 },
      { p: 14, weight: 1 },
    ],
    divisor: 9,
  },
  resolucion: {
    terms: [
      { p: 6, weight: 3 },
      { p: 7, weight: 2 },
      { p: 8, weight: 1 },
      { p: 9, weight: 1 },
      { p: 14, weight: 1 },
    ],
    divisor: 8,
  },
  creatividad: {
    terms: [
      { p: 7, weight: 3 },
      { p: 8, weight: 2 },
      { p: 10, weight: 1 },
      { p: 12, weight: 1 },
    ],
    divisor: 7,
  },
  escucha: {
    terms: [
      { p: 8, weight: 3 },
      { p: 2, weight: 2 },
      { p: 4, weight: 1 },
      { p: 12, weight: 1 },
      { p: 11, weight: 1 },
    ],
    divisor: 8,
  },
  productividad: {
    terms: [
      { p: 9, weight: 3 },
      { p: 1, weight: 2 },
      { p: 3, weight: 1 },
      { p: 4, weight: 1 },
      { p: 6, weight: 1 },
      { p: 7, weight: 1 },
      { p: 10, weight: 1 },
    ],
    divisor: 10,
  },
  aprendizaje: {
    terms: [
      { p: 10, weight: 4 },
      { p: 4, weight: 1 },
      { p: 7, weight: 1 },
      { p: 8, weight: 1 },
      { p: 13, weight: 1 },
    ],
    divisor: 8,
  },
  gestionEmocional: {
    terms: [
      { p: 12, weight: 3 },
      { p: 11, weight: 2 },
      { p: 14, weight: 1 },
      { p: 3, weight: 1 },
      { p: 8, weight: 1 },
    ],
    divisor: 8,
  },
};

const META_QUESTION_P = new Set([13, 14]);

const MIN_SCALE = 2;
const MAX_SCALE = 10;
/** Centro de escala 2–10. */
const DEFAULT_ANSWER = 6;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Compat: respuestas legacy guardadas con valores 1–5. */
function normalizeLegacyScale(raw: number): number {
  if (raw >= MIN_SCALE && raw <= MAX_SCALE) return raw;
  if (raw >= 1 && raw <= 5) return raw * 2;
  return DEFAULT_ANSWER;
}

/**
 * P13 (autopercepción) tiene 6 opciones categóricas.
 * - 1–5: mapea a 2, 4, 6, 8, 10.
 * - 6 («Un poco de todo»): neutro (6).
 */
function normalizeP13(value: number): number {
  if (value === 6) return DEFAULT_ANSWER;
  if (value >= 1 && value <= 5) return value * 2;
  return clamp(normalizeLegacyScale(value), MIN_SCALE, MAX_SCALE);
}

function answerValue(answers: Record<string, number>, p: number): number {
  const raw = answers[`q${p}`];
  if (typeof raw !== 'number') {
    return DEFAULT_ANSWER;
  }
  if (p === 13) return normalizeP13(raw);
  return clamp(normalizeLegacyScale(raw), MIN_SCALE, MAX_SCALE);
}

/** Mapea cada opción de Q14 (escala 2–10) a skills foco para insights de plan. */
export const Q14_MOTIVATION_TO_FOCUS: Record<number, DiagnosticSkillId[]> = {
  2: ['gestionEmocional'],
  4: ['influencia', 'comunicacion'],
  6: ['productividad', 'liderazgo'],
  8: ['liderazgo', 'influencia', 'equipo'],
  10: ['gestionEmocional', 'aprendizaje', 'adaptabilidad'],
};

function resolveQ14Focus(q14: number): DiagnosticSkillId[] {
  const normalized = normalizeLegacyScale(q14);
  if (Q14_MOTIVATION_TO_FOCUS[normalized]) {
    return [...Q14_MOTIVATION_TO_FOCUS[normalized]];
  }
  return [];
}

/** Convierte un valor en escala 2..10 a score 0..100 para el radar. */
export function valueToScore(value: number): number {
  const clamped = clamp(normalizeLegacyScale(value), MIN_SCALE, MAX_SCALE);
  return Math.round(((clamped - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100);
}

/** Convierte score 0..100 de vuelta a escala 2..10 visible. */
export function scoreToScale210(score100: number): number {
  const clamped = clamp(score100, 0, 100);
  return Math.round((MIN_SCALE + (clamped / 100) * (MAX_SCALE - MIN_SCALE)) * 10) / 10;
}

/**
 * Evalúa la fórmula de una skill.
 * - `full`: usa divisor Excel (incluye P13/P14).
 * - `skillOnly`: solo P1–P12; divisor = suma de pesos usados.
 */
export function evaluateSkillFormula(
  formula: SkillFormulaDef,
  answers: Record<string, number>,
  mode: 'full' | 'skillOnly',
): number {
  let sum = 0;
  let weightSum = 0;

  for (const { p, weight } of formula.terms) {
    if (mode === 'skillOnly' && META_QUESTION_P.has(p)) continue;
    sum += answerValue(answers, p) * weight;
    weightSum += weight;
  }

  const divisor = mode === 'full' ? formula.divisor : weightSum;
  if (divisor <= 0) return 50;

  const raw = clamp(sum / divisor, MIN_SCALE, MAX_SCALE);
  return valueToScore(raw);
}

export type AdjustedScores = {
  /** Scores con solo P1–P12 (antes de ponderar autopercepción/motivación). */
  baseScores: Record<string, number>;
  /** Scores finales con fórmulas completas (P1–P14). */
  scores: Record<string, number>;
  focusAreas: string[];
};

export function computeAdjustedScores(
  answers: Record<string, number>,
  skills: readonly DiagnosticSkillId[],
): AdjustedScores {
  const baseScores: Record<string, number> = {};
  const scores: Record<string, number> = {};

  for (const skillId of skills) {
    const formula = SKILL_FORMULAS[skillId];
    baseScores[skillId] = evaluateSkillFormula(formula, answers, 'skillOnly');
    scores[skillId] = evaluateSkillFormula(formula, answers, 'full');
  }

  const q14 = answers['q14'];
  const focusAreas = typeof q14 === 'number' ? resolveQ14Focus(q14) : [];

  return { baseScores, scores, focusAreas };
}
