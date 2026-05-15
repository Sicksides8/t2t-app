export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-AR').format(value);
}
