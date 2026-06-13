'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { AdminPage, type AdminColumn } from './AdminPage';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from './ui/Toast';
import { UserActionsMenu, type UserActionKind } from './users/UserActionsMenu';
import { GrantPlanModal } from './users/GrantPlanModal';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { csvFilename, exportCsv } from '../lib/csv';
import { formatCurrency, formatDate, formatNumber } from '../lib/format';
import type { AdminUserRow, GrantPlanBody } from '../types';
import styles from '../app/dashboard.module.css';
import filterStyles from './CoursesFilters.module.css';
import userStyles from './users/UsersExtras.module.css';

type RoleFilter = 'all' | 'admin' | 'student';
type PlanFilter = 'all' | 'free' | 'pro' | 'elite';
type StatusFilter = 'all' | 'active' | 'trial' | 'cancelled' | 'none';
type OnboardingFilter = 'all' | 'completed' | 'pending';

type DialogKind =
  | 'cancel-subscription'
  | 'suspend'
  | 'reactivate'
  | 'promote'
  | 'demote'
  | 'delete';

const PLAN_KEYS: Array<{ value: PlanFilter; label: string }> = [
  { value: 'all', label: 'Todos los planes' },
  { value: 'free', label: 'FREE' },
  { value: 'pro', label: 'PRO' },
  { value: 'elite', label: 'ELITE' },
];

const STATUS_KEYS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'trial', label: 'En trial' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'none', label: 'Sin suscripcion' },
];

function planClass(plan: string): string {
  const lower = plan.toLowerCase();
  if (lower === 'pro') return userStyles.pillPro;
  if (lower === 'elite') return userStyles.pillElite;
  return userStyles.pillFree;
}

function statusClass(status: string | undefined): string {
  const lower = (status || '').toLowerCase();
  if (lower === 'active') return userStyles.statusActive;
  if (lower === 'trial' || lower === 'trialing') return userStyles.statusTrial;
  if (lower === 'cancelled' || lower === 'canceled') return userStyles.statusCancelled;
  return userStyles.statusNone;
}

function effectivePlan(row: AdminUserRow): string {
  return (row.subscriptionPlan || row.selectedPlan || 'free').toLowerCase();
}

function effectiveStatus(row: AdminUserRow): string {
  return (row.subscriptionStatus || '').toLowerCase();
}

function matchesStatusFilter(row: AdminUserRow, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  const status = effectiveStatus(row);
  if (filter === 'active') return status === 'active';
  if (filter === 'trial') return status === 'trial' || status === 'trialing';
  if (filter === 'cancelled') return status === 'cancelled' || status === 'canceled';
  if (filter === 'none') return !status;
  return true;
}

export function UsersView() {
  const toast = useToast();
  const { firebaseUser } = useAuth();
  const myUid = firebaseUser?.uid ?? '';

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [onboardingFilter, setOnboardingFilter] = useState<OnboardingFilter>('all');

  const [busyId, setBusyId] = useState<string | null>(null);
  const [grantTarget, setGrantTarget] = useState<AdminUserRow | null>(null);
  const [dialogKind, setDialogKind] = useState<DialogKind | null>(null);
  const [dialogTarget, setDialogTarget] = useState<AdminUserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminUserRow[]>('/api/admin/users');
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtersActive =
    Boolean(search.trim()) ||
    roleFilter !== 'all' ||
    planFilter !== 'all' ||
    statusFilter !== 'all' ||
    onboardingFilter !== 'all';

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (needle) {
        const haystack = `${row.displayName} ${row.email}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (roleFilter !== 'all' && row.role !== roleFilter) return false;
      if (planFilter !== 'all' && effectivePlan(row) !== planFilter) return false;
      if (!matchesStatusFilter(row, statusFilter)) return false;
      if (onboardingFilter === 'completed' && !row.onboardingCompleted) return false;
      if (onboardingFilter === 'pending' && row.onboardingCompleted) return false;
      return true;
    });
  }, [rows, search, roleFilter, planFilter, statusFilter, onboardingFilter]);

  const handleExport = useCallback(() => {
    exportCsv<AdminUserRow>(
      csvFilename('t2t-alumnos'),
      filteredRows,
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
        { key: 'disabled', label: 'Suspendido', value: (r) => (r.disabled ? 'si' : 'no') },
        { key: 'coins', label: 'Coins', value: (r) => r.coins ?? 0 },
        { key: 'totalSpent', label: 'Gastado USD', value: (r) => (r.totalSpent ?? 0).toFixed(2) },
        { key: 'lastPaymentAt', label: 'Ultimo pago', value: (r) => r.lastPaymentAt ?? '' },
        { key: 'createdAt', label: 'Alta', value: (r) => r.createdAt ?? '' },
      ],
    );
  }, [filteredRows]);

  function clearFilters() {
    setSearch('');
    setRoleFilter('all');
    setPlanFilter('all');
    setStatusFilter('all');
    setOnboardingFilter('all');
  }

  function openMenuAction(row: AdminUserRow, action: UserActionKind) {
    if (action === 'grant-plan') {
      setGrantTarget(row);
      return;
    }
    setDialogTarget(row);
    setDialogKind(action);
  }

  async function withRowBusy<T>(id: string, fn: () => Promise<T>): Promise<T | undefined> {
    setBusyId(id);
    try {
      return await fn();
    } finally {
      setBusyId(null);
    }
  }

  async function handleGrant(body: GrantPlanBody) {
    if (!grantTarget) return;
    const target = grantTarget;
    await withRowBusy(target.id, async () => {
      await apiFetch(`/api/admin/users/${target.id}/grant-plan`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast.show({
        tone: 'success',
        title: 'Plan otorgado',
        message: `${target.displayName} ahora tiene ${body.planId.toUpperCase()} por ${body.durationDays} dias.`,
      });
      await load();
    });
  }

  async function confirmDialog() {
    if (!dialogTarget || !dialogKind) return;
    const target = dialogTarget;
    const kind = dialogKind;
    try {
      await withRowBusy(target.id, async () => {
        if (kind === 'cancel-subscription') {
          await apiFetch(`/api/admin/users/${target.id}/cancel-subscription`, {
            method: 'POST',
            body: JSON.stringify({}),
          });
          toast.show({
            tone: 'success',
            message: `Suscripcion de ${target.displayName} cancelada.`,
          });
        } else if (kind === 'suspend') {
          await apiFetch(`/api/admin/users/${target.id}/suspend`, {
            method: 'POST',
            body: JSON.stringify({ disabled: true }),
          });
          toast.show({
            tone: 'success',
            message: `${target.displayName} fue suspendido. Sus sesiones quedaron invalidadas.`,
          });
        } else if (kind === 'reactivate') {
          await apiFetch(`/api/admin/users/${target.id}/suspend`, {
            method: 'POST',
            body: JSON.stringify({ disabled: false }),
          });
          toast.show({ tone: 'success', message: `${target.displayName} fue reactivado.` });
        } else if (kind === 'promote') {
          await apiFetch(`/api/admin/users/${target.id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: 'admin' }),
          });
          toast.show({
            tone: 'success',
            message: `${target.displayName} ahora es admin.`,
          });
        } else if (kind === 'demote') {
          await apiFetch(`/api/admin/users/${target.id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: 'student' }),
          });
          toast.show({ tone: 'success', message: `${target.displayName} ya no es admin.` });
        } else if (kind === 'delete') {
          await apiFetch(`/api/admin/users/${target.id}`, { method: 'DELETE' });
          toast.show({
            tone: 'success',
            title: 'Usuario eliminado',
            message: `${target.displayName} fue borrado del sistema.`,
          });
        }
        await load();
      });
    } catch (err) {
      toast.show({
        tone: 'error',
        title: 'No se pudo completar la accion',
        message: err instanceof Error ? err.message : 'Error desconocido',
      });
    } finally {
      setDialogKind(null);
      setDialogTarget(null);
    }
  }

  function dialogCopy(kind: DialogKind | null, target: AdminUserRow | null) {
    if (!kind || !target) {
      return { title: '', message: '', confirmLabel: 'Confirmar', tone: 'default' as const };
    }
    const name = target.displayName || target.email || target.id;
    if (kind === 'cancel-subscription') {
      return {
        title: 'Cancelar suscripcion',
        message: `Vas a cancelar la suscripcion activa de ${name}. Quedara marcada como cancelled en t2t_subscriptions.`,
        confirmLabel: 'Si, cancelar',
        tone: 'default' as const,
      };
    }
    if (kind === 'suspend') {
      return {
        title: 'Suspender cuenta',
        message: `${name} no podra iniciar sesion en la app y sus sesiones activas se invalidaran. Podes reactivarlo despues.`,
        confirmLabel: 'Si, suspender',
        tone: 'danger' as const,
      };
    }
    if (kind === 'reactivate') {
      return {
        title: 'Reactivar cuenta',
        message: `${name} podra volver a iniciar sesion en la app.`,
        confirmLabel: 'Si, reactivar',
        tone: 'default' as const,
      };
    }
    if (kind === 'promote') {
      return {
        title: 'Hacer admin',
        message: `${name} tendra acceso completo al CRM. Sus tokens actuales se revocaran para que el rol tome efecto al volver a entrar.`,
        confirmLabel: 'Si, hacer admin',
        tone: 'default' as const,
      };
    }
    if (kind === 'demote') {
      return {
        title: 'Quitar admin',
        message: `${name} volvera a ser un alumno regular y perdera el acceso al CRM al refrescar su sesion.`,
        confirmLabel: 'Si, quitar admin',
        tone: 'default' as const,
      };
    }
    return {
      title: 'Eliminar usuario',
      message: `Vas a borrar a ${name} (${target.email}) en Firestore y Firebase Auth. Los pagos y movimientos de coins historicos se conservan. Esta accion no se puede deshacer.`,
      confirmLabel: 'Si, eliminar',
      tone: 'danger' as const,
    };
  }

  const dialogContent = dialogCopy(dialogKind, dialogTarget);

  const columns: AdminColumn<AdminUserRow>[] = [
    {
      key: 'displayName',
      label: 'Alumno',
      render: (row) => (
        <div className={userStyles.identity}>
          <Link href={`/users/${row.id}`} className={`${styles.rowLink} ${userStyles.identityName}`}>
            {row.displayName}
          </Link>
          <span className={userStyles.identityEmail}>{row.email || '—'}</span>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan / status',
      render: (row) => {
        const plan = effectivePlan(row);
        const status = effectiveStatus(row);
        return (
          <div className={userStyles.pillRow}>
            <span className={`${userStyles.pill} ${planClass(plan)}`}>{plan.toUpperCase()}</span>
            {status ? (
              <span className={`${userStyles.pill} ${statusClass(status)}`}>{status}</span>
            ) : (
              <span className={`${userStyles.pill} ${userStyles.statusNone}`}>sin sub</span>
            )}
            {row.disabled ? (
              <span className={`${userStyles.pill} ${userStyles.suspended}`}>Suspendido</span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'role',
      label: 'Rol',
      render: (row) => (
        <span
          className={`${userStyles.pill} ${
            row.role === 'admin' ? userStyles.roleAdmin : userStyles.roleStudent
          }`}
        >
          {row.role}
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
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <UserActionsMenu
          isAdmin={row.role === 'admin'}
          isSuspended={Boolean(row.disabled)}
          hasActiveSubscription={
            effectiveStatus(row) === 'active' || effectiveStatus(row) === 'trial'
          }
          isSelf={row.id === myUid}
          busy={busyId === row.id}
          onSelect={(action) => openMenuAction(row, action)}
        />
      ),
    },
  ];

  const filtersBar = (
    <div className={filterStyles.filtersBar}>
      <input
        type="search"
        className={filterStyles.searchInput}
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar alumno"
      />
      <select
        className={filterStyles.select}
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
        aria-label="Filtrar por rol"
      >
        <option value="all">Todos los roles</option>
        <option value="student">Alumnos</option>
        <option value="admin">Admins</option>
      </select>
      <select
        className={filterStyles.select}
        value={planFilter}
        onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
        aria-label="Filtrar por plan"
      >
        {PLAN_KEYS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className={filterStyles.select}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        aria-label="Filtrar por estado de suscripcion"
      >
        {STATUS_KEYS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className={filterStyles.select}
        value={onboardingFilter}
        onChange={(e) => setOnboardingFilter(e.target.value as OnboardingFilter)}
        aria-label="Filtrar por onboarding"
      >
        <option value="all">Todo onboarding</option>
        <option value="completed">Completaron</option>
        <option value="pending">Pendientes</option>
      </select>
      {filtersActive ? (
        <button type="button" className={filterStyles.clearBtn} onClick={clearFilters}>
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );

  const emptyMessage = filtersActive
    ? 'Ningun alumno coincide con los filtros. Probá ajustarlos.'
    : 'No hay usuarios en t2t_users.';

  return (
    <>
      <AdminPage
        title="Alumnos"
        columns={columns}
        rows={filteredRows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage={emptyMessage}
        headerAction={
          <div className={filterStyles.headerActions}>
            <div className={filterStyles.topRow}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className={styles.muted}>
                  {filteredRows.length} de {rows.length} alumno{rows.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleExport}
                  disabled={filteredRows.length === 0}
                  title={filteredRows.length > 0 ? 'Exportar CSV' : 'Sin filas para exportar'}
                >
                  <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Exportar CSV
                </button>
              </div>
            </div>
            {filtersBar}
          </div>
        }
      />

      <GrantPlanModal
        open={grantTarget !== null}
        userName={grantTarget?.displayName ?? ''}
        onClose={() => setGrantTarget(null)}
        onSubmit={handleGrant}
      />

      <ConfirmDialog
        open={dialogKind !== null}
        title={dialogContent.title}
        message={dialogContent.message}
        confirmLabel={dialogContent.confirmLabel}
        cancelLabel="Cancelar"
        tone={dialogContent.tone}
        loading={dialogTarget ? busyId === dialogTarget.id : false}
        onConfirm={confirmDialog}
        onCancel={() => {
          if (dialogTarget && busyId === dialogTarget.id) return;
          setDialogKind(null);
          setDialogTarget(null);
        }}
      />
    </>
  );
}
