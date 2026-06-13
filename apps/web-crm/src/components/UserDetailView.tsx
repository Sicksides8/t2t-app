'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Coins, Download, MinusCircle, PlusCircle } from 'lucide-react';
import { AppShell } from './layout/AppShell';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import { apiFetch } from '../lib/api';
import { csvFilename, exportCsv } from '../lib/csv';
import {
  formatCoins,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from '../lib/format';
import type { CoinTxRow, PaymentRow, UserDetail } from '../types';
import styles from '../app/dashboard.module.css';

type Tab = 'info' | 'subscription' | 'payments' | 'coins';

type Props = { uid: string };

export function UserDetailView({ uid }: Props) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('coins');
  const [grantOpen, setGrantOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<UserDetail>(`/api/admin/users/${uid}`);
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el usuario');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGrant = useCallback(
    async (amount: number, reason: string) => {
      await apiFetch(`/api/admin/users/${uid}/coins/grant`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      });
      toast.show({ tone: 'success', message: `Otorgaste ${formatCoins(amount)}` });
      await load();
    },
    [uid, load, toast],
  );

  const handleAdjust = useCallback(
    async (delta: number, reason: string) => {
      await apiFetch(`/api/admin/users/${uid}/coins/adjust`, {
        method: 'POST',
        body: JSON.stringify({ delta, reason }),
      });
      toast.show({
        tone: 'success',
        message: delta > 0 ? `Sumaste ${formatCoins(delta)}` : `Descontaste ${formatCoins(-delta)}`,
      });
      await load();
    },
    [uid, load, toast],
  );

  const exportCoinsCsv = useCallback(() => {
    if (!detail) return;
    exportCsv<CoinTxRow>(
      csvFilename(`t2t-coins-${detail.user.displayName.toLowerCase().replace(/\s+/g, '-')}`),
      detail.coinsHistory,
      [
        { key: 'createdAt', label: 'Fecha', value: (r) => r.createdAt ?? '' },
        { key: 'type', label: 'Tipo', value: (r) => r.type },
        { key: 'amount', label: 'Monto', value: (r) => r.amount },
        { key: 'reason', label: 'Razon', value: (r) => r.reason },
        { key: 'adminEmail', label: 'Admin', value: (r) => r.adminEmail ?? '' },
      ],
    );
  }, [detail]);

  return (
    <AppShell title="Detalle de alumno">
      <p className={styles.back}>
        <Link href="/users" className={styles.rowLink}>
          <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Volver a alumnos
        </Link>
      </p>

      {loading && !detail ? <p className={styles.status}>Cargando...</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {detail ? (
        <>
          <section className={styles.panel}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 18,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>{detail.user.displayName}</h2>
                <p className={styles.muted} style={{ margin: '6px 0 0' }}>
                  {detail.user.email} · <code>{detail.user.id}</code>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className={styles.badge}>
                  {(detail.subscription?.planId || detail.user.subscriptionPlan || 'free').toUpperCase()}
                </span>
                {detail.subscription?.status ? (
                  <span className={styles.muted}>{detail.subscription.status}</span>
                ) : null}
              </div>
            </div>
          </section>

          <nav
            style={{
              display: 'flex',
              gap: 8,
              margin: '18px 0 0',
              flexWrap: 'wrap',
            }}
          >
            {([
              ['info', 'Info'],
              ['subscription', 'Suscripcion'],
              ['payments', `Pagos (${detail.payments.length})`],
              ['coins', `Coins (${formatNumber(detail.coinsBalance)})`],
            ] as Array<[Tab, string]>).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid var(--divider)',
                  background:
                    tab === key
                      ? 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))'
                      : 'var(--glass)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === 'info' ? <InfoTab detail={detail} /> : null}
          {tab === 'subscription' ? <SubscriptionTab detail={detail} /> : null}
          {tab === 'payments' ? <PaymentsTab detail={detail} /> : null}
          {tab === 'coins' ? (
            <CoinsTab
              detail={detail}
              onGrant={() => setGrantOpen(true)}
              onAdjust={() => setAdjustOpen(true)}
              onExport={exportCoinsCsv}
            />
          ) : null}
        </>
      ) : null}

      <GrantModal
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        onSubmit={handleGrant}
      />
      <AdjustModal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        onSubmit={handleAdjust}
      />
    </AppShell>
  );
}

// -----------------------------------------------------------------------------
// Tabs
// -----------------------------------------------------------------------------

function InfoTab({ detail }: { detail: UserDetail }) {
  return (
    <section className={styles.panel}>
      <dl className={styles.detailList}>
        <div>
          <dt>ID</dt>
          <dd><code>{detail.user.id}</code></dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{detail.user.email}</dd>
        </div>
        <div>
          <dt>Rol</dt>
          <dd>{detail.user.role}</dd>
        </div>
        <div>
          <dt>Onboarding</dt>
          <dd>{detail.user.onboardingCompleted ? 'Completado' : 'Pendiente'}</dd>
        </div>
        <div>
          <dt>Coins</dt>
          <dd>{formatCoins(detail.coinsBalance)}</dd>
        </div>
        <div>
          <dt>Gastado total</dt>
          <dd>
            {detail.user.totalSpent ? formatCurrency(detail.user.totalSpent) : '—'}
          </dd>
        </div>
        <div>
          <dt>Ultimo pago</dt>
          <dd>{formatDate(detail.user.lastPaymentAt)}</dd>
        </div>
        <div>
          <dt>Alta</dt>
          <dd>{formatDate(detail.user.createdAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

function SubscriptionTab({ detail }: { detail: UserDetail }) {
  if (!detail.subscription) {
    return (
      <section className={styles.panel}>
        <p className={styles.empty}>El usuario no tiene un doc en t2t_subscriptions.</p>
      </section>
    );
  }
  const s = detail.subscription;
  return (
    <section className={styles.panel}>
      <dl className={styles.detailList}>
        <div><dt>Plan</dt><dd>{s.planId.toUpperCase()}</dd></div>
        <div><dt>Status</dt><dd>{s.status}</dd></div>
        <div><dt>Origen</dt><dd>{s.source}</dd></div>
        <div><dt>Ciclo</dt><dd>{s.cycle}</dd></div>
        <div><dt>Inicio</dt><dd>{formatDate(s.startDate)}</dd></div>
        <div><dt>Vencimiento</dt><dd>{formatDate(s.endDate)}</dd></div>
        {s.couponCode ? (
          <div><dt>Cupon</dt><dd>{s.couponCode}</dd></div>
        ) : null}
        {s.discountPercent ? (
          <div><dt>Descuento</dt><dd>{s.discountPercent}%</dd></div>
        ) : null}
      </dl>
    </section>
  );
}

function PaymentsTab({ detail }: { detail: UserDetail }) {
  if (detail.payments.length === 0) {
    return (
      <section className={styles.panel}>
        <p className={styles.empty}>Sin pagos registrados.</p>
      </section>
    );
  }
  return (
    <section className={styles.panel}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>TX</th>
            <th>Plan</th>
            <th>Metodo</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {detail.payments.map((p: PaymentRow) => (
            <tr key={p.id}>
              <td>{formatDateTime(p.paidAt)}</td>
              <td><code>{p.txId}</code></td>
              <td>{p.planLabel || p.plan.toUpperCase()}</td>
              <td>{p.method}</td>
              <td>{formatCurrency(p.amount, p.currency)}</td>
              <td><span className={styles.badge}>{p.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CoinsTab({
  detail,
  onGrant,
  onAdjust,
  onExport,
}: {
  detail: UserDetail;
  onGrant: () => void;
  onAdjust: () => void;
  onExport: () => void;
}) {
  return (
    <>
      <section className={styles.panel}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Coins size={42} color="#FFD24E" />
            <div>
              <p className={styles.muted} style={{ margin: 0 }}>Balance actual</p>
              <strong style={{ fontSize: 30 }}>{formatCoins(detail.coinsBalance)}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className={styles.actionBtn} onClick={onGrant}>
              <PlusCircle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Otorgar
            </button>
            <button type="button" className={styles.actionBtn} onClick={onAdjust}>
              <MinusCircle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Ajustar
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={onExport}
              disabled={detail.coinsHistory.length === 0}
            >
              <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              CSV
            </button>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h3 style={{ marginTop: 0 }}>Historial</h3>
        {detail.coinsHistory.length === 0 ? (
          <p className={styles.empty}>El usuario no tiene movimientos de coins.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Razon</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {detail.coinsHistory.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDateTime(tx.createdAt)}</td>
                  <td>
                    <span className={styles.badge}>{tx.type}</span>
                  </td>
                  <td
                    style={{
                      color: tx.amount > 0 ? '#5BD7A2' : '#FF8FA3',
                      fontWeight: 700,
                    }}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </td>
                  <td>{tx.reason}</td>
                  <td>{tx.adminEmail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

// -----------------------------------------------------------------------------
// Modals
// -----------------------------------------------------------------------------

function GrantModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number, reason: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState('100');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setAmount('100');
      setReason('');
      setBusy(false);
    }
  }, [open]);

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.show({ tone: 'error', message: 'El monto debe ser mayor a 0' });
      return;
    }
    if (!reason.trim()) {
      toast.show({ tone: 'error', message: 'Indica una razon para auditoria' });
      return;
    }
    setBusy(true);
    try {
      await onSubmit(n, reason.trim());
      onClose();
    } catch (err) {
      toast.show({
        tone: 'error',
        message: err instanceof Error ? err.message : 'No se pudo otorgar coins',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Otorgar coins"
      description="Suma coins al usuario. La operacion queda registrada en el historial."
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={styles.actionBtn} onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className={styles.actionBtn} onClick={submit} disabled={busy}>
            {busy ? 'Otorgando...' : 'Otorgar'}
          </button>
        </>
      }
    >
      <label className={styles.form}>
        <span className={styles.muted}>Monto</span>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
      </label>
      <label className={styles.form}>
        <span className={styles.muted}>Razon</span>
        <input
          type="text"
          value={reason}
          placeholder="Ej: regalo de bienvenida, premio campana, etc."
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
    </Modal>
  );
}

function AdjustModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (delta: number, reason: string) => Promise<void>;
}) {
  const [delta, setDelta] = useState('-50');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setDelta('-50');
      setReason('');
      setBusy(false);
    }
  }, [open]);

  async function submit() {
    const n = Number(delta);
    if (!Number.isFinite(n) || n === 0) {
      toast.show({ tone: 'error', message: 'El delta no puede ser 0' });
      return;
    }
    if (!reason.trim()) {
      toast.show({ tone: 'error', message: 'Indica una razon para auditoria' });
      return;
    }
    setBusy(true);
    try {
      await onSubmit(n, reason.trim());
      onClose();
    } catch (err) {
      toast.show({
        tone: 'error',
        message: err instanceof Error ? err.message : 'No se pudo ajustar coins',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Ajustar coins"
      description="Permite valores negativos. No se puede dejar al usuario con balance negativo."
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className={styles.actionBtn} onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className={styles.actionBtn} onClick={submit} disabled={busy}>
            {busy ? 'Ajustando...' : 'Aplicar ajuste'}
          </button>
        </>
      }
    >
      <label className={styles.form}>
        <span className={styles.muted}>Delta (+ suma / - resta)</span>
        <input
          type="number"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          autoFocus
        />
      </label>
      <label className={styles.form}>
        <span className={styles.muted}>Razon</span>
        <input
          type="text"
          value={reason}
          placeholder="Ej: correccion manual, abuso, devolucion, etc."
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
    </Modal>
  );
}
