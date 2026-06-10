'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, ImagePlus, Trash2, UploadCloud, Video } from 'lucide-react';
import { apiFetch, getAuthToken } from '../../lib/api';
import styles from './CourseModal.module.css';

type MediaKind = 'video' | 'thumbnail' | 'pdf';

type MediaUploaderProps = {
  kind: MediaKind;
  value?: string;
  onChange: (url: string | undefined, meta?: { durationSec?: number; key?: string }) => void;
  scope?: string;
  disabled?: boolean;
  compact?: boolean;
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
const PDF_ACCEPT = 'application/pdf';
const VIDEO_MAX_MB = 500;
const IMAGE_MAX_MB = 5;
const PDF_MAX_MB = 25;

function acceptFor(kind: MediaKind): string {
  if (kind === 'video') return VIDEO_ACCEPT;
  if (kind === 'pdf') return PDF_ACCEPT;
  return IMAGE_ACCEPT;
}

function maxMbFor(kind: MediaKind): number {
  if (kind === 'video') return VIDEO_MAX_MB;
  if (kind === 'pdf') return PDF_MAX_MB;
  return IMAGE_MAX_MB;
}

function dropzoneTitle(kind: MediaKind): string {
  if (kind === 'video') return 'Arrastrá tu video o hacé clic';
  if (kind === 'pdf') return 'Arrastrá un PDF o hacé clic';
  return 'Arrastrá una imagen o hacé clic';
}

function dropzoneHint(kind: MediaKind): string {
  if (kind === 'video') return `mp4, webm o mov · hasta ${VIDEO_MAX_MB} MB`;
  if (kind === 'pdf') return `pdf · hasta ${PDF_MAX_MB} MB`;
  return `jpg, png o webp · hasta ${IMAGE_MAX_MB} MB`;
}

function fileBasenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const last = decodeURIComponent(parsed.pathname.split('/').pop() || '');
    return last || 'archivo.pdf';
  } catch {
    return url.split('/').pop() || 'archivo.pdf';
  }
}

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
  compact = false,
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
    } else if (kind === 'pdf') {
      if (file.type !== 'application/pdf') {
        setError('Formato no soportado. Solo se acepta PDF.');
        return;
      }
      if (file.size > PDF_MAX_MB * 1024 * 1024) {
        setError(`PDF demasiado grande. Máximo ${PDF_MAX_MB} MB.`);
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
    const previewUrl = kind === 'pdf' ? null : URL.createObjectURL(file);
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

  const accept = acceptFor(kind);
  const previewSrc = localPreviewUrl || value;
  const hasValue = kind === 'pdf' ? Boolean(value || filename) : Boolean(previewSrc);
  const Icon = kind === 'video' ? Video : kind === 'pdf' ? FileText : ImagePlus;
  const dropzoneClass = `${styles.dropzone} ${compact ? styles.dropzoneSmall : ''} ${
    dragOver ? styles.dropzoneActive : ''
  }`;

  return (
    <div className={styles.uploader}>
      {!hasValue ? (
        <label
          className={dropzoneClass}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !busy) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <UploadCloud size={compact ? 22 : 28} aria-hidden />
          <span className={styles.dropzoneTitle}>{dropzoneTitle(kind)}</span>
          <span className={styles.dropzoneHint}>{dropzoneHint(kind)}</span>
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
          {kind === 'video' && previewSrc ? (
            <video className={styles.previewVideo} src={previewSrc} controls preload="metadata" />
          ) : null}
          {kind === 'thumbnail' && previewSrc ? (
            <img className={styles.previewImage} src={previewSrc} alt="Portada" />
          ) : null}
          {kind === 'pdf' ? (
            <div className={styles.pdfPreview}>
              <FileText size={28} aria-hidden />
              <div className={styles.pdfPreviewText}>
                <strong>{filename || (value ? fileBasenameFromUrl(value) : 'Documento PDF')}</strong>
                {value ? (
                  <a href={value} target="_blank" rel="noreferrer" className={styles.pdfPreviewLink}>
                    Abrir en una pestaña nueva
                  </a>
                ) : (
                  <span>Listo para subir.</span>
                )}
              </div>
            </div>
          ) : null}
          <div className={styles.uploaderInfo}>
            <span>
              <Icon size={14} aria-hidden /> {filename ||
                (kind === 'video'
                  ? 'Video subido'
                  : kind === 'pdf'
                    ? value
                      ? fileBasenameFromUrl(value)
                      : 'PDF subido'
                    : 'Imagen subida')}
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
