/**
 * Convierte el texto libre del campo "Habilidad" en un slug estable que se
 * usa como `Course.skillId` en Firestore.
 *
 * Ejemplos:
 *   "Liderazgo"            -> "liderazgo"
 *   "Comunicación"         -> "comunicacion"
 *   "Liderazgo Avanzado"   -> "liderazgo-avanzado"
 *   "  Marketing & Sales " -> "marketing-sales"
 *   ""                     -> ""
 *
 * Importante: este slug es lo que matchea con los IDs hardcodeados en la
 * app móvil (`apps/mobile/src/data/academy.ts`) y con los chips de Explorar.
 * Mantener case-insensitive y sin acentos garantiza compatibilidad.
 */
export function slugifySkill(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Versión legible para mostrar en CRM cuando solo tenemos el slug. */
export function humanizeSkillId(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}
