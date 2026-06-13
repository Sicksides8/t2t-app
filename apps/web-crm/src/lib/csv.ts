'use client';

/**
 * Helpers reutilizables de export CSV.
 *
 * Decision: usamos CSV con BOM UTF-8 en lugar de XLSX para evitar la dependencia
 * `xlsx` (~600 KB). Excel/Numbers/Google Sheets abren correctamente CSV con BOM
 * preservando acentos.
 */

export type CsvColumn<T> = {
  key: string;
  label: string;
  value: (row: T) => unknown;
};

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = value instanceof Date ? value.toISOString() : String(value);
  if (/["\n;,]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.value(row))).join(','))
    .join('\n');
  return body ? `${head}\n${body}` : head;
}

export function downloadCsv(filename: string, content: string): void {
  if (typeof window === 'undefined') return;
  // BOM UTF-8 para que Excel detecte el encoding correcto (acentos / coins / etc).
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Atajo: genera el CSV y dispara la descarga en una sola llamada.
 */
export function exportCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  downloadCsv(filename, toCsv(rows, columns));
}

/**
 * Construye un nombre de archivo `prefix-YYYY-MM-DD.csv`.
 */
export function csvFilename(prefix: string, date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${prefix}-${y}-${m}-${d}.csv`;
}
