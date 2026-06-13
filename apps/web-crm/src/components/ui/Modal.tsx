'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  /** Bloquea cierre por overlay/Esc mientras se procesa una accion. */
  busy?: boolean;
  /** Botones de accion al pie (alineados a la derecha). */
  footer?: React.ReactNode;
  /** Ancho maximo (px). Default 480. */
  maxWidth?: number;
  children: React.ReactNode;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  busy = false,
  footer,
  maxWidth = 480,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h3 id="modal-title" className={styles.title}>
              {title}
            </h3>
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label="Cerrar"
            onClick={onClose}
            disabled={busy}
          >
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>
  );
}
