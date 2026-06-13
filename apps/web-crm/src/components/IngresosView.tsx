'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { AppShell } from './layout/AppShell';
import { MetricCard } from './ui/MetricCard';
import { apiFetch } from '../lib/api';
import { csvFilename, exportCsv } from '../lib/csv';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from '../lib/format';
import type { PaymentRow, RevenueKpis } from '../types';
import styles from '../app/dashboard.module.css';

type Filters = {
  from: string;
  to: string;
  plan: string;
  method: string;
  status: string;
};

const DEFAULT_FILTERS: Filters = {
  from: '',
  to: '',
  plan: '',
  method: '',
  status: '',
};

const PLAN_OPTIONS = [
  { value: '', label: 'Todos los planes' },
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'elite', label: 'Elite' },
];

const METHOD_OPTIONS = [
  { value: '', label: 'Todos los metodos' },
  { value: 'Apple IAP', label: 'Apple IAP' },
  { value: 'Apple Pay', label: 'Apple Pay' },
  { value: 'Google Play', label: 'Google Play' },
  { value: 'Stripe', label: 'Stripe' },
  { value: 'MercadoPago', label: 'MercadoPago' },
  { value: 'Mock', label: 'Mock' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'paid', label: 'Cobrado' },
  { value: 'refunded', label: 'Devuelto' },
  { value: 'pending', label: 'Pendiente' },
];

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', new Date(filters.from).toISOString());
  if (filters.to) {
    const end = new Date(filters.to);
    end.setUTCHours(23, 59, 59, 999);
    params.set('to', end.toISOString());
  }
  if (filters.plan) params.set('plan', filters.plan);
  if (filters.method) params.set('method', filters.method);
  if (filters.status) params.set('status', filters.status);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function IngresosView() {
  const [kpis, setKpis] = useState<RevenueKpis | null>(null);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery(filters);
      const [summary, payments] = await Promise.all([
        apiFetch<RevenueKpis>('/api/admin/revenue/summary'),
        apiFetch<PaymentRow[]>(`/api/admin/payments${query}`),
      ]);
      setKpis(summary);
      setRows(payments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los ingresos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const currency = kpis?.currency || 'USD';

  const handleExport = useCallback(() => {
    exportCsv<PaymentRow>(
      csvFilename('t2t-ingresos'),
      rows,
      [
        { key: 'txId', label: 'TX', value: (r) => r.txId },
        { key: 'paidAt', label: 'Fecha', value: (r) => r.paidAt ?? '' },
        { key: 'userId', label: 'Usuario', value: (r) => r.userId },
        { key: 'plan', label: 'Plan', value: (r) => r.plan },
        { key: 'planLabel', label: 'Plan label', value: (r) => r.planLabel },
        { key: 'cycle', label: 'Ciclo', value: (r) => r.cycle ?? '' },
        { key: 'method', label: 'Metodo', value: (r) => r.method },
        { key: 'amount', label: 'Monto', value: (r) => r.amount.toFixed(2) },
        { key: 'currency', label: 'Moneda', value: (r) => r.currency },
        { key: 'status', label: 'Estado', value: (r) => r.status },
        { key: 'couponCode', label: 'Cupon', value: (r) => r.couponCode ?? '' },
      ],
    );
  }, [rows]);

  const tableHasData = rows.length > 0;

  const chartData = useMemo(() => kpis?.timeseries ?? [], [kpis]);

  return (
    <AppShell title="Ingresos">
      <section className={styles.panel}>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <label>
            <span className={styles.muted}>Desde</span>{' '}
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </label>
          <label>
            <span className={styles.muted}>Hasta</span>{' '}
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </label>
          <select
            value={filters.plan}
            onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value }))}
          >
            {PLAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filters.method}
            onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))}
          >
            {METHOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading}>
            Aplicar
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExport}
            disabled={!tableHasData}
            title={tableHasData ? 'Exportar CSV' : 'Sin filas para exportar'}
          >
            <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Exportar CSV
          </button>
        </form>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading && !kpis ? <p className={styles.status}>Cargando ingresos...</p> : null}

      <section className={styles.grid} style={{ marginTop: 18 }}>
        <MetricCard
          label="MRR"
          value={kpis ? formatCurrency(kpis.mrr, currency) : '—'}
          hint="Suscripciones activas + trial"
        />
        <MetricCard
          label="Ingresos del mes"
          value={kpis ? formatCurrency(kpis.monthRevenue, currency) : '—'}
        />
        <MetricCard
          label={`Ingresos del ano`}
          value={kpis ? formatCurrency(kpis.yearRevenue, currency) : '—'}
        />
        <MetricCard
          label="Ticket promedio"
          value={kpis ? formatCurrency(kpis.avgTicket, currency) : '—'}
        />
        <MetricCard
          label="Pagos cobrados"
          value={kpis ? formatNumber(kpis.paidCount) : '—'}
        />
        <MetricCard
          label="Devoluciones"
          value={kpis ? formatNumber(kpis.refundedCount) : '—'}
        />
        <MetricCard
          label="Total historico"
          value={kpis ? formatCurrency(kpis.totalRevenue, currency) : '—'}
        />
        <MetricCard
          label="Planes vendidos"
          value={kpis ? formatNumber(kpis.byPlan.reduce((acc, p) => acc + p.count, 0)) : '—'}
        />
      </section>

      <section className={styles.panel}>
        <h2 style={{ marginTop: 0 }}>Tendencia (ultimos 90 dias)</h2>
        {chartData.length === 0 ? (
          <p className={styles.empty}>Sin datos para graficar.</p>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="day"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => formatCurrency(v, currency)}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1F0A40',
                    border: '1px solid rgba(255,255,255,0.16)',
                    borderRadius: 12,
                  }}
                  formatter={(value) =>
                    [formatCurrency(Number(value ?? 0), currency), 'Ingresos'] as [string, string]
                  }
                  labelFormatter={(label) => String(label ?? '')}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#B73CEF"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className={styles.grid} style={{ marginTop: 18, gridTemplateColumns: '1fr 1fr' }}>
        <article className={styles.panel} style={{ margin: 0 }}>
          <h3 style={{ marginTop: 0 }}>Por plan</h3>
          {kpis && kpis.byPlan.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Cobros</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {kpis.byPlan.map((p) => (
                  <tr key={p.plan}>
                    <td>{p.plan.toUpperCase()}</td>
                    <td>{formatNumber(p.count)}</td>
                    <td>{formatCurrency(p.revenue, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.empty}>Sin pagos registrados.</p>
          )}
        </article>
        <article className={styles.panel} style={{ margin: 0 }}>
          <h3 style={{ marginTop: 0 }}>Por metodo de pago</h3>
          {kpis && kpis.byMethod.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Metodo</th>
                  <th>Cobros</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {kpis.byMethod.map((m) => (
                  <tr key={m.method}>
                    <td>{m.method}</td>
                    <td>{formatNumber(m.count)}</td>
                    <td>{formatCurrency(m.revenue, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.empty}>Sin metodos registrados.</p>
          )}
        </article>
      </section>

      <section className={styles.panel}>
        <h2 style={{ marginTop: 0 }}>Pagos</h2>
        {rows.length === 0 ? (
          <p className={styles.empty}>
            {loading ? 'Cargando pagos...' : 'No hay pagos para los filtros seleccionados.'}
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>TX</th>
                <th>Usuario</th>
                <th>Plan</th>
                <th>Ciclo</th>
                <th>Metodo</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Cupon</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{formatDateTime(p.paidAt)}</td>
                  <td><code>{p.txId}</code></td>
                  <td><code>{p.userId.slice(0, 8)}</code></td>
                  <td>{p.planLabel || p.plan.toUpperCase()}</td>
                  <td>{p.cycle ?? '—'}</td>
                  <td>{p.method}</td>
                  <td>{formatCurrency(p.amount, p.currency)}</td>
                  <td>
                    <span className={styles.badge}>{p.status}</span>
                  </td>
                  <td>{p.couponCode ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppShell>
  );
}
