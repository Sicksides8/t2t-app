'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { AdminPage, type AdminColumn } from './AdminPage';
import { apiFetch } from '../lib/api';
import { csvFilename, exportCsv } from '../lib/csv';
import { formatCurrency, formatDate, formatNumber } from '../lib/format';
import type { AdminUserRow } from '../types';
import styles from '../app/dashboard.module.css';

const columns: AdminColumn<AdminUserRow>[] = [
  {
    key: 'displayName',
    label: 'Nombre',
    render: (row) => (
      <Link href={`/users/${row.id}`} className={styles.rowLink}>
        {row.displayName}
      </Link>
    ),
  },
  { key: 'email', label: 'Email' },
  {
    key: 'plan',
    label: 'Plan / status',
    render: (row) => (
      <span>
        {(row.subscriptionPlan || row.selectedPlan || '—').toUpperCase()}
        {row.subscriptionStatus ? ` · ${row.subscriptionStatus}` : ''}
      </span>
    ),
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    render: (row) => (row.onboardingCompleted ? 'OK' : 'Pendiente'),
  },
  {
    key: 'coins',
    label: 'Coins',
    render: (row) => (row.coins != null ? formatNumber(row.coins) : '—'),
  },
  {
    key: 'totalSpent',
    label: 'Gastado',
    render: (row) =>
      row.totalSpent && row.totalSpent > 0 ? formatCurrency(row.totalSpent) : '—',
  },
  {
    key: 'lastPaymentAt',
    label: 'Ultimo pago',
    render: (row) => formatDate(row.lastPaymentAt),
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

  const handleExport = useCallback(() => {
    exportCsv<AdminUserRow>(
      csvFilename('t2t-alumnos'),
      rows,
      [
        { key: 'id', label: 'ID', value: (r) => r.id },
        { key: 'displayName', label: 'Nombre', value: (r) => r.displayName },
        { key: 'email', label: 'Email', value: (r) => r.email },
        { key: 'role', label: 'Rol', value: (r) => r.role },
        { key: 'plan', label: 'Plan', value: (r) => r.subscriptionPlan ?? r.selectedPlan ?? '' },
        { key: 'status', label: 'Estado sub', value: (r) => r.subscriptionStatus ?? '' },
        {
          key: 'onboarding',
          label: 'Onboarding',
          value: (r) => (r.onboardingCompleted ? 'completado' : 'pendiente'),
        },
        { key: 'coins', label: 'Coins', value: (r) => r.coins ?? 0 },
        { key: 'totalSpent', label: 'Gastado USD', value: (r) => (r.totalSpent ?? 0).toFixed(2) },
        { key: 'lastPaymentAt', label: 'Ultimo pago', value: (r) => r.lastPaymentAt ?? '' },
        { key: 'createdAt', label: 'Alta', value: (r) => r.createdAt ?? '' },
      ],
    );
  }, [rows]);

  return (
    <AdminPage
      title="Alumnos"
      description="Listado real desde Firestore (t2t_users). Click en el nombre para abrir el detalle."
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      loading={loading}
      error={error}
      emptyMessage="No hay usuarios en t2t_users."
      headerAction={
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className={styles.muted}>
            {rows.length} registro{rows.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExport}
            disabled={rows.length === 0}
            title={rows.length > 0 ? 'Exportar CSV' : 'Sin filas para exportar'}
          >
            <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Exportar CSV
          </button>
        </div>
      }
    />
  );
}
