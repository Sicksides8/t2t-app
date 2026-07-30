/** Quita prefijos redundantes del título de lección (CRM legacy). */
export function formatLessonTitle(title: string): string {
  const cleaned = title
    .replace(/^m[oó]dulo\s*\d+\s*[-–—:·]\s*/i, '')
    .replace(/^contenido del curso\s*[-–—:·]\s*/i, '')
    .trim();
  return cleaned || title;
}

export function formatLessonChipLabel(
  title: string,
  index: number,
  total: number,
): string {
  const label = formatLessonTitle(title);
  return `Módulo ${index} de ${total} · ${label}`;
}
