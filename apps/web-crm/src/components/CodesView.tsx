'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { AdminPage, type AdminColumn } from './AdminPage';
import { CreateCodeModal } from './codes/CreateCodeModal';
import { apiFetch } from '../lib/api';
import { formatDate } from '../lib/format';
import type {
  CodeAppliesTo,
  CreateCodeBody,
  SubscriptionCodeRow,
} from '../types';
import styles from '../app/dashboard.module.css';
import filterStyles from './CoursesFilters.module.css';
import codeStyles from './codes/CodesExtras.module.css';

type CodeStatus = 'available' | 'used' | 'expired';

function computeStatus(row: SubscriptionCodeRow): CodeStatus {
  if (row.used) return 'used';
  if (row.expiresAt && Date.parse(row.expiresAt) <= Date.now()) return 'expired';
  return 'available';
}

function appliesLabel(appliesTo: CodeAppliesTo | undefined, fallbackPlan: string): string {
  if (appliesTo === 'any_paid') return 'Pago (PRO + ELITE)';
  if (appliesTo === 'pro') return 'PRO';
  if (appliesTo === 'elite') return 'ELITE';
  return fallbackPlan ? fallbackPlan.toUpperCase() : '—';
}

function appliesPillClass(appliesTo: CodeAppliesTo | undefined, fallbackPlan: string): string {
  const target = appliesTo ?? (fallbackPlan as CodeAppliesTo);
  if (target === 'pro') return codeStyles.appliesPro;
  if (target === 'elite') return codeStyles.appliesElite;
  return '';
}

const columns: AdminColumn<SubscriptionCodeRow>[] = [
  {
    key: 'id',
    label: 'Codigo',
    render: (row) => <span className={codeStyles.codeBadge}>{row.id}</span>,
  },
  {
    key: 'title',
    label: 'Titulo',
    render: (row) => row.title || <span className={styles.muted}>—</span>,
  },
  {
    key: 'discount',
    label: 'Descuento',
    render: (row) => {
      const pct = row.discountPercent ?? 0;
      if (pct === 100) return <span className={codeStyles.discountFree}>Gratis</span>;
      if (pct > 0) return <span className={codeStyles.discountOff}>{pct}% off</span>;
      return <span className={styles.muted}>—</span>;
    },
  },
  {
    key: 'appliesTo',
    label: 'Aplica a',
    render: (row) => (
      <span
        className={`${codeStyles.appliesPill} ${appliesPillClass(row.appliesTo, row.planId)}`}
      >
        {appliesLabel(row.appliesTo, row.planId)}
      </span>
    ),
  },
  {
    key: 'durationDays',
    label: 'Duracion',
    render: (row) => `${row.durationDays} dias`,
  },
  {
    key: 'expiresAt',
    label: 'Expira',
    render: (row) =>
      row.expiresAt ? formatDate(row.expiresAt) : <span className={styles.muted}>Sin expiracion</span>,
  },
  {
    key: 'used',
    label: 'Estado',
    render: (row) => {
      const status = computeStatus(row);
      const map = {
        available: { label: 'Disponible', cls: codeStyles.statusAvailable },
        used: { label: 'Usado', cls: codeStyles.statusUsed },
        expired: { label: 'Expirado', cls: codeStyles.statusExpired },
      } as const;
      const info = map[status];
      return <span className={`${codeStyles.statusPill} ${info.cls}`}>{info.label}</span>;
    },
  },
  {
    key: 'usedBy',
    label: 'Usado por',
    render: (row) => row.usedBy || <span className={styles.muted}>—</span>,
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
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SubscriptionCodeRow[]>('/api/admin/codes');
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar codigos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = useCallback(
    async (body: CreateCodeBody): Promise<SubscriptionCodeRow> => {
      const created = await apiFetch<SubscriptionCodeRow>('/api/admin/codes', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await load();
      return created;
    },
    [load],
  );

  return (
    <>
      <AdminPage
        title="Codigos"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No hay codigos todavia. Crea el primero con el boton de arriba."
        headerAction={
          <div className={filterStyles.headerActions}>
            <div className={filterStyles.topRow}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className={styles.muted}>
                  {rows.length} codigo{rows.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  className={filterStyles.createBtn}
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus size={16} />
                  Crear codigo
                </button>
              </div>
            </div>
          </div>
        }
      />

      <CreateCodeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
