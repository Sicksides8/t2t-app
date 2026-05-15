'use client';

import { AppShell } from './layout/AppShell';
import styles from '../app/dashboard.module.css';

export type AdminColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type AdminPageProps<T> = {
  title: string;
  description?: string;
  columns: AdminColumn<T>[];
  rows: T[];
  rowKey?: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  headerAction?: React.ReactNode;
};

export function AdminPage<T extends object>({
  title,
  description,
  columns,
  rows,
  rowKey,
  loading,
  error,
  emptyMessage = 'Sin registros',
  headerAction,
}: AdminPageProps<T>) {
  return (
    <AppShell title={title}>
      <section className={styles.panel}>
        {description ? <p className={styles.description}>{description}</p> : null}
        {headerAction ? <div className={styles.toolbar}>{headerAction}</div> : null}
        {loading ? <p className={styles.status}>Cargando datos...</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {!loading && !error ? (
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={styles.empty}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const key = rowKey ? rowKey(row) : String((row as { id?: string }).id ?? index);
                  return (
                    <tr key={key}>
                      {columns.map((col) => (
                        <td key={col.key}>
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : null}
      </section>
    </AppShell>
  );
}
