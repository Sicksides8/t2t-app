'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styles from './Toast.module.css';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastInput = {
  id?: string;
  tone?: ToastTone;
  title?: string;
  message: string;
  durationMs?: number;
};

type Toast = Required<Pick<ToastInput, 'id' | 'tone' | 'message'>> & {
  title?: string;
  durationMs: number;
};

type ToastContextValue = {
  show: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (toast: ToastInput) => {
      const id = toast.id ?? `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const next: Toast = {
        id,
        tone: toast.tone ?? 'info',
        title: toast.title,
        message: toast.message,
        durationMs: toast.durationMs ?? (toast.tone === 'error' ? 6000 : 3500),
      };
      setItems((prev) => [...prev.filter((t) => t.id !== id), next]);
      return id;
    },
    [],
  );

  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map((toast) =>
      window.setTimeout(() => dismiss(toast.id), toast.durationMs),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [items, dismiss]);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite">
        {items.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`} role="status">
            <div className={styles.toastBody}>
              {toast.title ? <strong>{toast.title}</strong> : null}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              className={styles.toastClose}
              aria-label="Cerrar"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
