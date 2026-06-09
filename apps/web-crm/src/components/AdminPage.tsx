'use client';

import { AppShell } from './layout/AppShell';
import styles from '../app/dashboard.module.css';
import selectionStyles from './CoursesFilters.module.css';

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
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onToggleKey?: (key: string, row: T) => void;
  onToggleAll?: () => void;
  bulkBar?: React.ReactNode;
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
  selectable = false,
  selectedKeys,
  onToggleKey,
  onToggleAll,
  bulkBar,
}: AdminPageProps<T>) {
  const selectionSize = selectedKeys?.size ?? 0;
  const visibleKeys = rows.map((row, index) =>
    rowKey ? rowKey(row) : String((row as { id?: string }).id ?? index),
  );
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selectedKeys?.has(k));
  const someVisibleSelected = !allVisibleSelected && visibleKeys.some((k) => selectedKeys?.has(k));
  const totalCols = columns.length + (selectable ? 1 : 0);

  return (
    <AppShell title={title}>
      <section className={styles.panel}>
        {description ? <p className={styles.description}>{description}</p> : null}
        {headerAction ? <div className={styles.toolbar}>{headerAction}</div> : null}
        {selectable && bulkBar && selectionSize > 0 ? (
          <div className={selectionStyles.bulkBar}>{bulkBar}</div>
        ) : null}
        {loading ? <p className={styles.status}>Cargando datos...</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {!loading && !error ? (
          <table className={styles.table}>
            <thead>
              <tr>
                {selectable ? (
                  <th className={selectionStyles.selectCell}>
                    <input
                      type="checkbox"
                      className={selectionStyles.selectCheckbox}
                      aria-label={
                        allVisibleSelected ? 'Deseleccionar todos' : 'Seleccionar todos los visibles'
                      }
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someVisibleSelected;
                      }}
                      onChange={() => onToggleAll?.()}
                      disabled={visibleKeys.length === 0}
                    />
                  </th>
                ) : null}
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className={styles.empty}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const key = rowKey ? rowKey(row) : String((row as { id?: string }).id ?? index);
                  const isSelected = selectedKeys?.has(key) ?? false;
                  return (
                    <tr key={key} className={isSelected ? selectionStyles.rowSelected : ''}>
                      {selectable ? (
                        <td className={selectionStyles.selectCell}>
                          <input
                            type="checkbox"
                            className={selectionStyles.selectCheckbox}
                            aria-label={`Seleccionar fila ${index + 1}`}
                            checked={isSelected}
                            onChange={() => onToggleKey?.(key, row)}
                          />
                        </td>
                      ) : null}
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
