'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Crown,
  MoreVertical,
  ShieldCheck,
  ShieldX,
  Trash2,
  XCircle,
} from 'lucide-react';
import styles from './UsersExtras.module.css';

export type UserActionKind =
  | 'grant-plan'
  | 'cancel-subscription'
  | 'suspend'
  | 'reactivate'
  | 'promote'
  | 'demote'
  | 'delete';

type Props = {
  isAdmin: boolean;
  isSuspended: boolean;
  hasActiveSubscription: boolean;
  isSelf: boolean;
  busy?: boolean;
  onSelect: (action: UserActionKind) => void;
};

export function UserActionsMenu({
  isAdmin,
  isSuspended,
  hasActiveSubscription,
  isSelf,
  busy = false,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function handle(action: UserActionKind) {
    setOpen(false);
    onSelect(action);
  }

  return (
    <div className={styles.kebabWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.kebabBtn} ${open ? styles.kebabBtnOpen : ''}`}
        aria-label="Acciones del alumno"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div className={styles.menu} role="menu" id={menuId}>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => handle('grant-plan')}
          >
            <Crown size={14} /> Otorgar plan
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            disabled={!hasActiveSubscription}
            onClick={() => handle('cancel-subscription')}
          >
            <XCircle size={14} /> Cancelar suscripcion
          </button>
          <div className={styles.menuDivider} />
          {isSuspended ? (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              disabled={isSelf}
              onClick={() => handle('reactivate')}
            >
              <CheckCircle2 size={14} /> Reactivar cuenta
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              disabled={isSelf}
              onClick={() => handle('suspend')}
            >
              <Ban size={14} /> Suspender cuenta
            </button>
          )}
          {isAdmin ? (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              disabled={isSelf}
              onClick={() => handle('demote')}
            >
              <ShieldX size={14} /> Quitar admin
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              disabled={isSelf}
              onClick={() => handle('promote')}
            >
              <ShieldCheck size={14} /> Hacer admin
            </button>
          )}
          <div className={styles.menuDivider} />
          <button
            type="button"
            role="menuitem"
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
            disabled={isSelf}
            onClick={() => handle('delete')}
          >
            <Trash2 size={14} /> Eliminar usuario
          </button>
        </div>
      ) : null}
    </div>
  );
}
