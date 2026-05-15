'use client';

import { useEffect, useState } from 'react';
import { AdminPage, type AdminColumn } from './AdminPage';
import { apiFetch } from '../lib/api';
import { formatDate } from '../lib/format';
import type { AdminUserRow } from '../types';
import styles from '../app/dashboard.module.css';

const columns: AdminColumn<AdminUserRow>[] = [
  { key: 'displayName', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  {
    key: 'plan',
    label: 'Plan / onboarding',
    render: (row) => (
      <span>
        {row.selectedPlan || row.subscriptionId || '—'}
        {' · '}
        {row.onboardingCompleted ? 'Onboarding OK' : 'Pendiente'}
      </span>
    ),
  },
  {
    key: 'coins',
    label: 'Coins',
    render: (row) => (row.coins != null ? String(row.coins) : '—'),
  },
  {
    key: 'createdAt',
    label: 'Alta',
    render: (row) => formatDate(row.createdAt),
  },
];

export function UsersView() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<AdminUserRow[]>('/api/admin/users')
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar alumnos');
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
      title="Alumnos"
      description="Listado real desde Firestore (t2t_users)."
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      loading={loading}
      error={error}
      emptyMessage="No hay usuarios en t2t_users."
      headerAction={
        <span className={styles.muted}>
          {rows.length} registro{rows.length === 1 ? '' : 's'}
        </span>
      }
    />
  );
}
