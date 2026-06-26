import { SKILL_SUGGESTIONS } from './courseConstants';
import { slugifySkill } from './skillId';

/** IDs canónicos alineados con apps/mobile/src/data/academy.ts */
export const DIAGNOSTIC_SKILL_IDS = SKILL_SUGGESTIONS.map((s) => s.value);

export function resolveSkillId(input: string): string {
  const trimmed = String(input || '').trim();
  if (!trimmed) return '';
  const slug = slugifySkill(trimmed);
  const match = SKILL_SUGGESTIONS.find(
    (s) => s.value === trimmed || slugifySkill(s.label) === slug || s.value === slug,
  );
  return match?.value ?? slug;
}

export function normalizeSecondarySkillIds(
  primary: string,
  raw: string[] | undefined,
): string[] {
  const primaryId = resolveSkillId(primary);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw ?? []) {
    const id = resolveSkillId(item);
    if (!id || id === primaryId || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function normalizeSkillImpact(
  raw: Record<string, number> | undefined,
): Record<string, number> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, number> = {};
  for (const skillId of DIAGNOSTIC_SKILL_IDS) {
    const v = raw[skillId];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) continue;
    out[skillId] = Math.min(1, Math.max(0, v));
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function skillImpactCoverage(impact: Record<string, number> | undefined): number {
  if (!impact) return 0;
  return Object.values(impact).reduce((sum, g) => sum + g, 0);
}

export function emptySkillImpact(): Record<string, number> {
  return Object.fromEntries(DIAGNOSTIC_SKILL_IDS.map((id) => [id, 0]));
}

export function parsePlanOrder(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n);
}
