'use client';

import { useEffect, useState } from 'react';
import { AdminPage, type AdminColumn } from './AdminPage';
import { apiFetch } from '../lib/api';
import { formatDate } from '../lib/format';
import type { SubscriptionCodeRow } from '../types';
import styles from '../app/dashboard.module.css';

const columns: AdminColumn<SubscriptionCodeRow>[] = [
  { key: 'id', label: 'Codigo' },
  { key: 'planId', label: 'Plan' },
  {
    key: 'durationDays',
    label: 'Duracion (dias)',
    render: (row) => String(row.durationDays),
  },
  {
    key: 'used',
    label: 'Estado',
    render: (row) => (
      <span className={styles.badge}>{row.used ? 'Usado' : 'Disponible'}</span>
    ),
  },
  {
    key: 'usedBy',
    label: 'Usado por',
    render: (row) => row.usedBy || '—',
  },
  {
    key: 'createdAt',
    label: 'Creado',
    render: (row) => formatDate(row.createdAt),
  },
];

export function CodesView() {
  const [rows, setRows] = useState<SubscriptionCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<SubscriptionCodeRow[]>('/api/admin/codes')
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar codigos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminPage
      title="Codigos"
      description="Codigos de canje en t2t_subscription_codes."
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      loading={loading}
      error={error}
      emptyMessage="No hay codigos. Usa el seed SEED-T2T-* o crea documentos en Firestore."
    />
  );
}
