/**
 * Utilidades de fechas para cohortes (semana ISO y mes calendario UTC).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Lunes de la semana ISO que contiene `date` (en UTC). */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // ISO: Monday = 1, Sunday = 7
  const day = d.getUTCDay() || 7;
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

/** Devuelve YYYY-WW (semana ISO) en UTC. */
export function isoWeekLabel(date: Date): string {
  const monday = startOfIsoWeek(date);
  // Algoritmo ISO 8601 week number
  const target = new Date(monday.getTime());
  target.setUTCDate(target.getUTCDate() + 3); // jueves de esa semana
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diffDays = (target.getTime() - firstThursday.getTime()) / DAY_MS;
  const week = 1 + Math.round((diffDays - 3 + ((firstThursday.getUTCDay() || 7) - 1)) / 7);
  const year = target.getUTCFullYear();
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Inicio del mes UTC que contiene `date`. */
export function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Devuelve YYYY-MM en UTC. */
export function monthLabel(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Suma N dias a una fecha (UTC, inmutable). */
export function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Suma N meses a una fecha (UTC). */
export function addMonthsUtc(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

export const DAY_MS_CONST = DAY_MS;
