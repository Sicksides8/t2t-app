'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { AppShell } from './layout/AppShell';
import { MediaUploader } from './courses/MediaUploader';
import { SubtitlesEditor } from './courses/SubtitlesEditor';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from './ui/Toast';
import type { SubtitleTrack } from '../types';
import styles from './WelcomeVideoView.module.css';

type ConfigResponse = {
  welcomeVideoUrl: string | null;
  welcomeVideoSubtitles: SubtitleTrack[];
};

export function WelcomeVideoView() {
  const toast = useToast();
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const persistSeqRef = useRef(0);
  const removedAssetUrlsRef = useRef<Set<string>>(new Set());

  const busy = saving || uploading;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<ConfigResponse>('/api/admin/welcome-video');
      setCurrentUrl(data.welcomeVideoUrl);
      setSubtitles(data.welcomeVideoSubtitles ?? []);
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
    async (
      patch: { videoUrl?: string | null; subtitles?: SubtitleTrack[] },
      options?: { onSuccessMessage?: string },
    ) => {
      const seq = ++persistSeqRef.current;
      setSaving(true);
      try {
        const data = await apiFetch<ConfigResponse>('/api/admin/welcome-video', {
          method: 'PUT',
          body: JSON.stringify(patch),
        });
        if (seq !== persistSeqRef.current) return;
        setCurrentUrl(data.welcomeVideoUrl);
        setSubtitles(data.welcomeVideoSubtitles ?? []);
        toast.show({
          tone: 'success',
          message: options?.onSuccessMessage ?? 'Configuracion actualizada',
        });
      } catch (err) {
        if (seq !== persistSeqRef.current) return;
        const message = err instanceof Error ? err.message : 'No se pudo guardar';
        toast.show({ tone: 'error', message });
      } finally {
        if (seq === persistSeqRef.current) {
          setSaving(false);
        }
      }
    },
    [toast],
  );

  const handleUpload = useCallback(
    (url: string | undefined) => {
      if (!url) return;
      void persist({ videoUrl: url }, { onSuccessMessage: 'Video de bienvenida actualizado' });
    },
    [persist],
  );

  const handleSubtitlesChange = useCallback(
    (next: SubtitleTrack[]) => {
      setSubtitles(next);
      void persist(
        { subtitles: next },
        { onSuccessMessage: 'Subtitulos del video de bienvenida actualizados' },
      );
    },
    [persist],
  );

  const handleRemove = useCallback(() => {
    setConfirmRemove(false);
    void persist(
      { videoUrl: null, subtitles: [] },
      { onSuccessMessage: 'Volviste al video demo por defecto' },
    );
  }, [persist]);

  const trackRemovedAsset = useCallback((url: string) => {
    removedAssetUrlsRef.current.add(url);
  }, []);

  return (
    <AppShell title="Video de bienvenida">
      <section className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title}>Video de bienvenida del onboarding</h2>
          <p className={styles.description}>
            Este video se reproduce en el paso final del onboarding (paso 56) y en el home
            post-registro. Si no subis uno, la app usa el video demo por defecto. Subi un .mp4,
            .webm o .mov de hasta 2 GB.
          </p>
        </header>

        {loading ? (
          <div className={styles.skeleton}>Cargando configuracion...</div>
        ) : (
          <>
            <div className={styles.statusRow}>
              {uploading ? (
                <span className={styles.badge}>Subiendo video...</span>
              ) : saving ? (
                <span className={styles.badge}>Guardando...</span>
              ) : currentUrl ? (
                <span className={`${styles.badge} ${styles.badgeCustom}`}>
                  Video custom activo
                </span>
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
                onBusyChange={setUploading}
                disabled={busy}
              />
            </div>

            <div className={styles.uploaderBlock}>
              <div className={styles.sectionLabel}>Subtitulos por idioma (opcional)</div>
              <SubtitlesEditor
                value={subtitles}
                scope="welcome"
                disabled={busy}
                onPrevReplaced={trackRemovedAsset}
                onChange={handleSubtitlesChange}
              />
            </div>

            {currentUrl ? (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  disabled={busy}
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
          message="El video custom se borrara del storage y la app volvera a usar el demo por defecto. Tambien se quitaran los subtitulos asociados. ¿Continuar?"
          confirmLabel="Quitar"
          cancelLabel="Cancelar"
          tone="danger"
          loading={busy}
          onConfirm={handleRemove}
          onCancel={() => setConfirmRemove(false)}
        />
      </section>
    </AppShell>
  );
}
