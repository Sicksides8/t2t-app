'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import type { CodeAppliesTo, CreateCodeBody, SubscriptionCodeRow } from '../../types';
import styles from './CodesExtras.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: CreateCodeBody) => Promise<SubscriptionCodeRow>;
};

const DURATION_PRESETS = [7, 30, 90, 365];
const DEFAULT_DURATION = 30;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

const APPLIES_OPTIONS: Array<{ value: CodeAppliesTo; label: string }> = [
  { value: 'pro', label: 'PRO' },
  { value: 'elite', label: 'ELITE' },
  { value: 'any_paid', label: 'Cualquier plan pago (PRO + ELITE)' },
];

export function CreateCodeModal({ open, onClose, onSubmit }: Props) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountInput, setDiscountInput] = useState<string>('20');
  const [appliesTo, setAppliesTo] = useState<CodeAppliesTo>('any_paid');
  const [durationDays, setDurationDays] = useState<number>(DEFAULT_DURATION);
  const [hasExpiration, setHasExpiration] = useState<boolean>(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setCode('');
      setTitle('');
      setDiscountInput('20');
      setAppliesTo('any_paid');
      setDurationDays(DEFAULT_DURATION);
      setHasExpiration(false);
      setExpiresAt('');
      setBusy(false);
    }
  }, [open]);

  const discountPercent = Number(discountInput);
  const discountIsValid =
    discountInput !== '' &&
    Number.isInteger(discountPercent) &&
    discountPercent >= 1 &&
    discountPercent <= 100;
  const isFree = discountIsValid && discountPercent === 100;

  function handleDiscountChange(raw: string) {
    const cleaned = raw.replace(/[^\d]/g, '').slice(0, 3);
    if (cleaned === '') {
      setDiscountInput('');
      return;
    }
    const n = Number(cleaned);
    if (n > 100) {
      setDiscountInput('100');
      return;
    }
    setDiscountInput(String(n));
  }

  const appliesLabel = useMemo(() => {
    const opt = APPLIES_OPTIONS.find((o) => o.value === appliesTo);
    return opt?.label ?? appliesTo;
  }, [appliesTo]);

  async function submit() {
    const finalTitle = title.trim();
    if (!finalTitle) {
      toast.show({ tone: 'error', message: 'El titulo es obligatorio' });
      return;
    }
    if (!discountIsValid) {
      toast.show({ tone: 'error', message: 'El descuento debe ser un entero entre 1 y 100' });
      return;
    }
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) {
      toast.show({ tone: 'error', message: 'La duracion debe ser entre 1 y 365 dias' });
      return;
    }
    let isoExpires: string | null = null;
    if (hasExpiration) {
      if (!expiresAt) {
        toast.show({ tone: 'error', message: 'Seleccione una fecha de expiracion o desmarque la opcion' });
        return;
      }
      const ms = Date.parse(expiresAt);
      if (!Number.isFinite(ms) || ms <= Date.now()) {
        toast.show({ tone: 'error', message: 'La fecha de expiracion debe ser futura' });
        return;
      }
      isoExpires = new Date(ms).toISOString();
    }

    const body: CreateCodeBody = {
      code: code.trim() || undefined,
      title: finalTitle,
      discountPercent,
      appliesTo,
      expiresAt: isoExpires,
      durationDays,
    };

    setBusy(true);
    try {
      const created = await onSubmit(body);
      try {
        await navigator.clipboard?.writeText(created.id);
        toast.show({
          tone: 'success',
          title: 'Codigo creado',
          message: `${created.id} copiado al portapapeles.`,
        });
      } catch {
        toast.show({
          tone: 'success',
          title: 'Codigo creado',
          message: `Tu codigo es ${created.id}.`,
        });
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el codigo';
      const finalMessage = message === 'code_already_exists' ? 'Ese codigo ya existe. Elegi otro.' : message;
      toast.show({ tone: 'error', message: finalMessage });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Crear codigo de descuento"
      description="Generá un cupón promocional para PRO o ELITE."
      onClose={onClose}
      busy={busy}
      maxWidth={560}
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
            {busy ? 'Creando...' : 'Crear codigo'}
          </button>
        </>
      }
    >
      <div className={styles.formGrid}>
        <label className={`${styles.field} ${styles.fullWidth}`}>
          <span>Codigo (opcional)</span>
          <div className={styles.codeRow}>
            <input
              type="text"
              maxLength={24}
              placeholder="Vacio = se genera automatico"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button
              type="button"
              className={styles.miniBtn}
              onClick={() => setCode(randomCode(8))}
              title="Generar codigo aleatorio"
            >
              <Sparkles size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Generar
            </button>
          </div>
          <p className={styles.helperText}>4 a 24 caracteres. Solo A-Z, 0-9 y guion.</p>
        </label>

        <label className={`${styles.field} ${styles.fullWidth}`}>
          <span>Titulo</span>
          <input
            type="text"
            maxLength={120}
            placeholder="Ej: Promo lanzamiento Junio"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Descuento (%)</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
            placeholder="1 a 100"
            value={discountInput}
            onChange={(e) => handleDiscountChange(e.target.value)}
          />
          <p className={styles.helperText}>
            Entero entre 1 y 100. Con 100 el codigo entrega acceso GRATIS.
          </p>
        </label>

        <label className={styles.field}>
          <span>Plan aplicable</span>
          <select
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value as CodeAppliesTo)}
          >
            {APPLIES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.field} ${styles.fullWidth}`}>
          <span>Duracion (dias)</span>
          <input
            type="number"
            min={1}
            max={365}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value) || 1)}
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
          <p className={styles.helperText}>
            {isFree
              ? 'Con 100% el codigo activa el plan completo durante estos dias.'
              : 'Periodo de cobertura cuando se canjea o se aplica el descuento.'}
          </p>
        </label>

        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={hasExpiration}
              onChange={(e) => setHasExpiration(e.target.checked)}
            />
            <span style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>
              El codigo expira en una fecha especifica
            </span>
          </label>
          {hasExpiration ? (
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={{ marginTop: 6 }}
            />
          ) : null}
        </div>
      </div>

      <div className={`${styles.summary} ${isFree ? styles.summaryFree : ''}`}>
        {!discountIsValid ? (
          <>Ingresa un descuento entre 1 y 100 para ver el resumen.</>
        ) : isFree ? (
          <>
            <strong>Acceso GRATIS</strong> — al canjear este codigo, el alumno obtiene{' '}
            <strong>{appliesLabel}</strong> sin pagar durante <strong>{durationDays} dias</strong>.
          </>
        ) : (
          <>
            Aplica <strong>{discountPercent}% de descuento</strong> sobre{' '}
            <strong>{appliesLabel}</strong> por <strong>{durationDays} dias</strong>.
          </>
        )}
      </div>
    </Modal>
  );
}
