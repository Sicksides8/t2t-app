import type { Course, DiagnosticResult } from '../types';

/** Aplica gᵢ incremental: nuevo = actual + (100 - actual) * g */
export function computeSkillImpactScores(
  current: Record<string, number>,
  impact: Record<string, number> | undefined,
): Record<string, number> {
  if (!impact) return current;
  const next = { ...current };
  for (const [skillId, g] of Object.entries(impact)) {
    if (typeof g !== 'number' || !Number.isFinite(g) || g <= 0) continue;
    const actual = next[skillId] ?? 0;
    next[skillId] = actual + (100 - actual) * g;
  }
  return next;
}

/**
 * Actualiza diagnostic.scores al completar un curso (Documento Madre §3.4).
 * Persiste en t2t_diagnostic_results vía saveDiagnosticResult.
 */
export async function applyCourseSkillImpact(
  course: Pick<Course, 'skillImpact'>,
  diagnostic: DiagnosticResult,
  save: (next: DiagnosticResult) => Promise<void>,
): Promise<DiagnosticResult | null> {
  const impact = course.skillImpact;
  if (!impact || !Object.values(impact).some((g) => g > 0)) return null;

  const base = { ...(diagnostic.scores ?? {}) };
  const mergedScores = computeSkillImpactScores(base, impact);
  const updated: DiagnosticResult = {
    ...diagnostic,
    scores: mergedScores,
    baseScores: diagnostic.baseScores ?? base,
  };
  await save(updated);
  return updated;
}
