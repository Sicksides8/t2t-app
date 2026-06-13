'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { MediaUploader } from '../courses/MediaUploader';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import styles from './WelcomeVideoSettings.module.css';

type ConfigResponse = { welcomeVideoUrl: string | null };

export function WelcomeVideoSettings() {
  const toast = useToast();
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<ConfigResponse>('/api/admin/settings/welcome-video');
      setCurrentUrl(data.welcomeVideoUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo leer la configuracion';
      toast.show({ tone: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = useCallback(
    async (videoUrl: string | null, options?: { onSuccessMessage?: string }) => {
      setSaving(true);
      try {
        const data = await apiFetch<ConfigResponse>('/api/admin/settings/welcome-video', {
          method: 'PUT',
          body: JSON.stringify({ videoUrl }),
        });
        setCurrentUrl(data.welcomeVideoUrl);
        toast.show({
          tone: 'success',
          message: options?.onSuccessMessage ?? 'Configuracion actualizada',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo guardar';
        toast.show({ tone: 'error', message });
      } finally {
        setSaving(false);
      }
    },
    [toast],
  );

  const handleUpload = useCallback(
    (url: string | undefined) => {
      // El uploader limpia el orphan anterior internamente cuando reemplaza,
      // y luego llama onChange con la nueva URL. Solo persistimos el cambio.
      if (!url) return;
      void persist(url, { onSuccessMessage: 'Video de bienvenida actualizado' });
    },
    [persist],
  );

  const handleRemove = useCallback(() => {
    setConfirmRemove(false);
    void persist(null, { onSuccessMessage: 'Volviste al video demo por defecto' });
  }, [persist]);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>Video de bienvenida</h2>
        <p className={styles.description}>
          Este video se reproduce en el paso final del onboarding (paso 56). Si no subis uno, la app
          usa el video demo por defecto. Subi un .mp4, .webm o .mov de hasta 2 GB.
        </p>
      </header>

      {loading ? (
        <div className={styles.skeleton}>Cargando configuracion...</div>
      ) : (
        <>
          <div className={styles.statusRow}>
            {currentUrl ? (
              <span className={`${styles.badge} ${styles.badgeCustom}`}>Video custom activo</span>
            ) : (
              <span className={`${styles.badge} ${styles.badgeFallback}`}>
                Usando fallback demo
              </span>
            )}
          </div>

          <div className={styles.uploaderBlock}>
            <MediaUploader
              kind="video"
              scope="welcome"
              value={currentUrl ?? undefined}
              onChange={(url) => handleUpload(url)}
              disabled={saving}
            />
          </div>

          {currentUrl ? (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.dangerBtn}
                disabled={saving}
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 size={14} /> Quitar y usar fallback demo
              </button>
            </div>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={confirmRemove}
        title="Quitar video de bienvenida"
        message="El video custom se borrara del storage y la app volvera a usar el demo por defecto. ¿Continuar?"
        confirmLabel="Quitar"
        cancelLabel="Cancelar"
        tone="danger"
        loading={saving}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </section>
  );
}
