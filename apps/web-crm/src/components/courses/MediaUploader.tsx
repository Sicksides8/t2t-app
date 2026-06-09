'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, UploadCloud, Video } from 'lucide-react';
import { apiFetch, getAuthToken } from '../../lib/api';
import styles from './CourseModal.module.css';

type MediaKind = 'video' | 'thumbnail';

type MediaUploaderProps = {
  kind: MediaKind;
  value?: string;
  onChange: (url: string | undefined, meta?: { durationSec?: number; key?: string }) => void;
  scope?: string;
  disabled?: boolean;
  /** Llamado cuando ya hay value y el usuario lo reemplaza/quita. Útil para limpiar el orphan de R2. */
  onPrevReplaced?: (prevUrl: string) => void;
};

type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime';
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const VIDEO_MAX_MB = 500;
const IMAGE_MAX_MB = 5;

function readVideoDurationSec(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      const seconds = isFinite(video.duration) ? Math.round(video.duration) : null;
      cleanup();
      resolve(seconds);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
  authToken?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    if (authToken) {
      // R2 ignora cabeceras adicionales del client si no van firmadas; este header
      // se incluye solo si el endpoint lo necesita en algún proxy futuro.
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 PUT respondió ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Error de red al subir el archivo'));
    xhr.send(file);
  });
}

export function MediaUploader({
  kind,
  value,
  onChange,
  scope = 'new',
  disabled,
  onPrevReplaced,
}: MediaUploaderProps) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousUrlRef = useRef<string | undefined>(value);

  useEffect(() => {
    previousUrlRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  async function handleFile(file: File) {
    setError(null);
    if (kind === 'video') {
      if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
        setError('Formato no soportado. Usá mp4, webm o mov.');
        return;
      }
      if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
        setError(`Video demasiado grande. Máximo ${VIDEO_MAX_MB} MB.`);
        return;
      }
    } else {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Formato no soportado. Usá jpg, png o webp.');
        return;
      }
      if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
        setError(`Imagen demasiado grande. Máximo ${IMAGE_MAX_MB} MB.`);
        return;
      }
    }

    let durationSec: number | undefined;
    if (kind === 'video') {
      const detected = await readVideoDurationSec(file);
      if (detected) durationSec = detected;
    }

    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    const previewUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(previewUrl);
    setFilename(file.name);
    setBusy(true);
    setProgress(0);

    try {
      const presigned = await apiFetch<PresignResponse>('/api/admin/uploads/presign', {
        method: 'POST',
        body: JSON.stringify({
          kind,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          scope,
        }),
      });
      const token = await getAuthToken();
      await uploadWithProgress(presigned.uploadUrl, file, setProgress, token ?? undefined);

      const prev = previousUrlRef.current;
      if (prev && prev !== presigned.publicUrl) {
        onPrevReplaced?.(prev);
      }
      onChange(presigned.publicUrl, { durationSec, key: presigned.key });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo subir el archivo. Probá de nuevo.';
      setError(message);
      setLocalPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setFilename(null);
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragOver(false);
    if (disabled || busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = '';
  }

  function clearValue() {
    if (value && onPrevReplaced) onPrevReplaced(value);
    onChange(undefined);
    setFilename(null);
    setProgress(0);
    setError(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
  }

  const accept = kind === 'video' ? VIDEO_ACCEPT : IMAGE_ACCEPT;
  const maxMB = kind === 'video' ? VIDEO_MAX_MB : IMAGE_MAX_MB;
  const previewSrc = localPreviewUrl || value;
  const hasPreview = Boolean(previewSrc);
  const Icon = kind === 'video' ? Video : ImagePlus;

  return (
    <div className={styles.uploader}>
      {!hasPreview ? (
        <label
          className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !busy) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <UploadCloud size={28} aria-hidden />
          <span className={styles.dropzoneTitle}>
            {kind === 'video' ? 'Arrastrá tu video o hacé clic' : 'Arrastrá una imagen o hacé clic'}
          </span>
          <span className={styles.dropzoneHint}>
            {kind === 'video'
              ? `mp4, webm o mov · hasta ${maxMB} MB`
              : `jpg, png o webp · hasta ${maxMB} MB`}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className={styles.fileInputHidden}
            onChange={onPick}
            disabled={disabled || busy}
          />
        </label>
      ) : (
        <div className={styles.uploaderPreview}>
          {kind === 'video' ? (
            <video className={styles.previewVideo} src={previewSrc} controls preload="metadata" />
          ) : (
            <img className={styles.previewImage} src={previewSrc} alt="Portada" />
          )}
          <div className={styles.uploaderInfo}>
            <span>
              <Icon size={14} aria-hidden /> {filename || (kind === 'video' ? 'Video subido' : 'Imagen subida')}
            </span>
            {busy ? <span>{progress}%</span> : null}
          </div>
          {busy ? (
            <div className={styles.uploaderProgress}>
              <div className={styles.uploaderProgressFill} style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          <div className={styles.uploaderActions}>
            <button
              type="button"
              className={styles.iconBtn}
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud size={14} /> Reemplazar
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              disabled={disabled || busy}
              onClick={clearValue}
            >
              <Trash2 size={14} /> Quitar
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className={styles.fileInputHidden}
              onChange={onPick}
              disabled={disabled || busy}
            />
          </div>
        </div>
      )}
      {error ? <p className={styles.uploaderError}>{error}</p> : null}
    </div>
  );
}
