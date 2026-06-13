/**
 * Normaliza un valor de `skillId` a un slug estable.
 *
 * Esto es lo mismo que hace el CRM al guardar (apps/web-crm/src/lib/skillId.ts).
 * Se usa para hacer match case/acento-insensitive con cursos viejos creados
 * antes de la normalización del CRM (ej. "Liderazgo", "Comunicación").
 */
export function normalizeSkillId(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Compara dos skillIds de manera robusta (case + acento insensitive). */
export function sameSkillId(a: string | undefined, b: string | undefined): boolean {
  return normalizeSkillId(a || '') === normalizeSkillId(b || '');
}

/** Capitaliza un slug (`liderazgo-avanzado` → `Liderazgo Avanzado`). */
export function humanizeSkillId(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}
