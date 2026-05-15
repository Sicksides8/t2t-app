/** Elimina campos `undefined` antes de escribir en Firestore. */
export function withoutUndefined<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}
