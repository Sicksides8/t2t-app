'use client';

import { Captions, Plus, Trash2 } from 'lucide-react';
import type { SubtitleTrack } from '../../types';
import { MediaUploader } from './MediaUploader';
import styles from './CourseModal.module.css';

type SubtitlesEditorProps = {
  value: SubtitleTrack[];
  onChange: (next: SubtitleTrack[]) => void;
  scope?: string;
  disabled?: boolean;
  /** Llamado cuando se reemplaza/quita un VTT con URL previa, para limpiar orphans en R2. */
  onPrevReplaced?: (prevUrl: string) => void;
};

type LangPreset = { code: string; label: string };

const LANG_PRESETS: LangPreset[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
];

function nextAvailableLang(used: string[]): LangPreset {
  return LANG_PRESETS.find((p) => !used.includes(p.code)) || { code: '', label: '' };
}

function labelForCode(code: string): string {
  const preset = LANG_PRESETS.find((p) => p.code === code.toLowerCase());
  return preset ? preset.label : '';
}

export function SubtitlesEditor({
  value,
  onChange,
  scope = 'new',
  disabled,
  onPrevReplaced,
}: SubtitlesEditorProps) {
  const usedCodes = value.map((t) => t.lang.toLowerCase());

  function update(index: number, patch: Partial<SubtitleTrack>) {
    const next = value.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  }

  function remove(index: number) {
    const item = value[index];
    if (item?.url && onPrevReplaced) onPrevReplaced(item.url);
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    const fresh = nextAvailableLang(usedCodes);
    onChange([...value, { lang: fresh.code, label: fresh.label, url: '' }]);
  }

  return (
    <div className={styles.linksEditor}>
      {value.length === 0 ? (
        <p className={styles.linksHint}>
          Sumá subtítulos por idioma. Cada idioma se sube como archivo .vtt y los estudiantes
          podrán elegirlos desde el reproductor.
        </p>
      ) : (
        <ul className={styles.linksList} role="list">
          {value.map((track, index) => {
            const langTrim = track.lang.trim().toLowerCase();
            const langDuplicated =
              langTrim.length > 0 &&
              value.findIndex((t, i) => i !== index && t.lang.trim().toLowerCase() === langTrim) >= 0;
            const langInvalid = !langTrim || langDuplicated;

            return (
              <li
                key={index}
                className={styles.linkRow}
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={styles.linkIcon} aria-hidden>
                    <Captions size={14} />
                  </span>
                  <div className={styles.linkFields} style={{ flex: 1 }}>
                    <select
                      className={`${styles.linkLabelInput} ${langInvalid ? styles.inputInvalid : ''}`}
                      value={
                        LANG_PRESETS.some((p) => p.code === track.lang.toLowerCase())
                          ? track.lang.toLowerCase()
                          : 'custom'
                      }
                      onChange={(e) => {
                        const code = e.target.value;
                        if (code === 'custom') {
                          update(index, { lang: '', label: track.label || '' });
                        } else {
                          update(index, { lang: code, label: track.label || labelForCode(code) });
                        }
                      }}
                      disabled={disabled}
                      aria-label={`Idioma del subtítulo ${index + 1}`}
                    >
                      {LANG_PRESETS.map((preset) => (
                        <option key={preset.code} value={preset.code}>
                          {preset.label} ({preset.code})
                        </option>
                      ))}
                      <option value="custom">Otro (código manual)</option>
                    </select>
                    <input
                      type="text"
                      className={`${styles.linkLabelInput} ${langInvalid ? styles.inputInvalid : ''}`}
                      value={track.label}
                      onChange={(e) => update(index, { label: e.target.value })}
                      placeholder="Nombre visible (ej. Español)"
                      maxLength={40}
                      disabled={disabled}
                      aria-label={`Etiqueta del subtítulo ${index + 1}`}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.linkRemoveBtn}
                    aria-label={`Eliminar idioma ${index + 1}`}
                    onClick={() => remove(index)}
                    disabled={disabled}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {!LANG_PRESETS.some((p) => p.code === track.lang.toLowerCase()) ? (
                  <input
                    type="text"
                    className={`${styles.linkLabelInput} ${langInvalid ? styles.inputInvalid : ''}`}
                    value={track.lang}
                    onChange={(e) =>
                      update(index, { lang: e.target.value.trim().toLowerCase() })
                    }
                    placeholder="Código ISO (ej. ja, ko, ru)"
                    maxLength={8}
                    disabled={disabled}
                    aria-label={`Código de idioma ${index + 1}`}
                  />
                ) : null}
                {langDuplicated ? (
                  <span className={styles.errorText}>Ya hay un subtítulo para este idioma.</span>
                ) : null}
                <MediaUploader
                  kind="subtitle"
                  compact
                  value={track.url || undefined}
                  scope={scope}
                  disabled={disabled}
                  onPrevReplaced={(prev) => onPrevReplaced?.(prev)}
                  onChange={(url) => update(index, { url: url || '' })}
                />
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className={styles.linkAddBtn}
        onClick={add}
        disabled={disabled || usedCodes.length >= LANG_PRESETS.length + 8}
      >
        <Plus size={16} /> Añadir idioma
      </button>
    </div>
  );
}
