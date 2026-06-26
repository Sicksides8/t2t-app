import { skills as canonicalSkills } from '../data/academy';
import type { Course, Skill } from '../types';
import { humanizeSkillId, normalizeSkillId } from './skillId';

/** Clave compacta sin guiones — une camelCase (`gestionEmocional`) con slugs (`gestion-emocional`). */
export function compactSkillKey(input: string | undefined): string {
  return normalizeSkillId(input || '').replace(/-/g, '');
}

const CANONICAL_BY_COMPACT = new Map(
  canonicalSkills.map((s) => [compactSkillKey(s.id), s.id] as const),
);

const CANONICAL_BY_NAME_COMPACT = new Map(
  canonicalSkills.map((s) => [compactSkillKey(s.name), s.id] as const),
);

/** Variantes frecuentes del CRM / cursos legacy → id canónico. */
const EXPLICIT_ALIASES: Record<string, string> = {
  'liderazgo-humano': 'liderazgo',
  liderazgohumano: 'liderazgo',
  'gestion-emocional': 'gestionEmocional',
  gestionemocional: 'gestionEmocional',
  'trabajo-en-equipo': 'equipo',
  trabajoenequipo: 'equipo',
  'resolucion-de-problemas': 'resolucion',
  resoluciondeproblemas: 'resolucion',
};

/**
 * Resuelve un skillId de curso (texto libre, slug o camelCase del CRM)
 * al id canónico de las 11 habilidades T2T, o devuelve un slug estable si es desconocido.
 *
 * Misma lógica que apps/web-crm/src/lib/courseFields.ts `resolveSkillId`.
 */
export function resolveCanonicalSkillId(input: string | undefined): string {
  const trimmed = String(input || '').trim();
  if (!trimmed) return '';

  const slug = normalizeSkillId(trimmed);
  const compact = compactSkillKey(trimmed);

  const explicit = EXPLICIT_ALIASES[slug] ?? EXPLICIT_ALIASES[compact];
  if (explicit) return explicit;

  const byId = CANONICAL_BY_COMPACT.get(compact);
  if (byId) return byId;

  const byName = CANONICAL_BY_NAME_COMPACT.get(compact);
  if (byName) return byName;

  for (const skill of canonicalSkills) {
    const idCompact = compactSkillKey(skill.id);
    if (idCompact.length >= 4 && compact.startsWith(idCompact)) {
      return skill.id;
    }
  }

  return slug || trimmed;
}

export function isCanonicalSkillId(skillId: string): boolean {
  return canonicalSkills.some((s) => s.id === skillId);
}

/** Agrupa cursos bajo la misma categoría aunque el CRM haya guardado variantes del nombre. */
export function courseMatchesSkill(
  courseSkillId: string | undefined,
  targetSkillId: string,
): boolean {
  return (
    compactSkillKey(resolveCanonicalSkillId(courseSkillId)) ===
    compactSkillKey(resolveCanonicalSkillId(targetSkillId))
  );
}

export function countCoursesForSkill(courses: { skillId: string }[], skillId: string): number {
  return courses.filter((c) => courseMatchesSkill(c.skillId, skillId)).length;
}

/**
 * Catálogo de categorías para Explorar:
 * - Siempre incluye las 11 canónicas del diagnóstico.
 * - Fusiona skills remotas de Firestore si mapean a canónico.
 * - Agrega categorías extra sólo cuando hay cursos que no encajan en las 11.
 */
export function buildExploreCatalogSkills(remoteSkills: Skill[], courses: Course[]): Skill[] {
  const merged = new Map<string, Skill>();

  for (const skill of canonicalSkills) {
    merged.set(compactSkillKey(skill.id), { ...skill });
  }

  for (const remote of remoteSkills) {
    const canonicalId = resolveCanonicalSkillId(remote.id);
    if (isCanonicalSkillId(canonicalId)) {
      const existing = merged.get(compactSkillKey(canonicalId));
      if (existing) {
        merged.set(compactSkillKey(canonicalId), {
          ...existing,
          name: existing.name || remote.name,
          description: existing.description || remote.description,
        });
      }
      continue;
    }
    const key = compactSkillKey(remote.id);
    if (!merged.has(key)) {
      merged.set(key, remote);
    }
  }

  for (const course of courses) {
    const resolved = resolveCanonicalSkillId(course.skillId);
    if (isCanonicalSkillId(resolved)) continue;

    const key = compactSkillKey(resolved);
    if (merged.has(key)) continue;

    merged.set(key, {
      id: resolved,
      name: humanizeSkillId(resolved) || resolved,
      description: 'Habilidad disponible en el catálogo',
      icon: 'sparkles',
      color: '#7C7CFF',
      order: canonicalSkills.length + merged.size,
    });
  }

  return Array.from(merged.values()).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export function buildSkillCountMap(
  catalogSkills: Skill[],
  courses: { skillId: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const skill of catalogSkills) {
    counts[skill.id] = countCoursesForSkill(courses, skill.id);
  }
  return counts;
}

/** Categorías visibles en la grilla: solo las que tienen al menos un curso. */
export function skillsForCategoryGrid(catalogSkills: Skill[], counts: Record<string, number>): Skill[] {
  return catalogSkills.filter((skill) => (counts[skill.id] ?? 0) > 0);
}

export { canonicalSkills };
