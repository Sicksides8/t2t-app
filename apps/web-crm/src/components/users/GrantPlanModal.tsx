'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import type { GrantPlanBody } from '../../types';
import styles from './UsersExtras.module.css';

type Props = {
  open: boolean;
  userName: string;
  onClose: () => void;
  onSubmit: (body: GrantPlanBody) => Promise<void>;
};

const DURATION_PRESETS = [7, 30, 90, 365];

const PLAN_OPTIONS: Array<{ value: GrantPlanBody['planId']; label: string }> = [
  { value: 'pro', label: 'PRO' },
  { value: 'elite', label: 'ELITE' },
];

const CYCLE_OPTIONS: Array<{ value: GrantPlanBody['cycle']; label: string }> = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
];

export function GrantPlanModal({ open, userName, onClose, onSubmit }: Props) {
  const toast = useToast();
  const [planId, setPlanId] = useState<GrantPlanBody['planId']>('pro');
  const [cycle, setCycle] = useState<GrantPlanBody['cycle']>('monthly');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPlanId('pro');
      setCycle('monthly');
      setDurationDays(30);
      setReason('');
      setBusy(false);
    }
  }, [open]);

  const endDatePreview = useMemo(() => {
    const ms = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    return new Date(ms).toLocaleDateString();
  }, [durationDays]);

  async function submit() {
    const n = Number(durationDays);
    if (!Number.isInteger(n) || n <= 0) {
      toast.show({ tone: 'error', message: 'La duracion debe ser un entero positivo' });
      return;
    }
    if (!reason.trim()) {
      toast.show({ tone: 'error', message: 'Indica una razon para auditoria' });
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ planId, cycle, durationDays: n, reason: reason.trim() });
      onClose();
    } catch (err) {
      toast.show({
        tone: 'error',
        message: err instanceof Error ? err.message : 'No se pudo otorgar el plan',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Otorgar plan"
      description={`Activa un plan pago para ${userName} sin pasar por checkout.`}
      onClose={onClose}
      busy={busy}
      maxWidth={520}
      footer={
        <>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={submit}
            disabled={busy}
          >
            {busy ? 'Otorgando...' : 'Otorgar plan'}
          </button>
        </>
      }
    >
      <div className={styles.formGrid}>
        <label className={styles.formField}>
          <span>Plan</span>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value as GrantPlanBody['planId'])}
          >
            {PLAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span>Ciclo</span>
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value as GrantPlanBody['cycle'])}
          >
            {CYCLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.formField} ${styles.fullWidth}`}>
          <span>Duracion en dias</span>
          <input
            type="number"
            min={1}
            max={1825}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
          />
          <div className={styles.presetRow}>
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                className={`${styles.presetChip} ${
                  durationDays === d ? styles.presetChipActive : ''
                }`}
                onClick={() => setDurationDays(d)}
              >
                {d} dias
              </button>
            ))}
          </div>
        </label>

        <label className={`${styles.formField} ${styles.fullWidth}`}>
          <span>Razon</span>
          <textarea
            value={reason}
            placeholder="Ej: cortesia, soporte, promo influencer..."
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.summary}>
        Vas a activar <strong>{planId.toUpperCase()} {cycle === 'yearly' ? 'anual' : 'mensual'}</strong> hasta el{' '}
        <strong>{endDatePreview}</strong>.
      </div>
    </Modal>
  );
}
