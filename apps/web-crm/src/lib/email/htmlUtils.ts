/**
 * Helpers comunes para los templates de email transaccionales.
 * Se usa desde welcomeEmailTemplate, streakWarningEmailTemplate y
 * diagnosticResultEmailTemplate. Mantener cualquier helper nuevo aca
 * en vez de duplicarlo en cada template.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
