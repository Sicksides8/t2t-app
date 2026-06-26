'use client';

import { useState } from 'react';
import { SKILL_SUGGESTIONS } from '../../lib/courseConstants';
import { resolveSkillId } from '../../lib/courseFields';
import { humanizeSkillId } from '../../lib/skillId';
import styles from './CourseModal.module.css';

type Props = {
  label: string;
  hint: string;
  required?: boolean;
  values: string[];
  excludeIds?: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
  /** Valor del input único (modo single). */
  singleValue?: string;
  onSingleChange?: (value: string) => void;
  invalid?: boolean;
  errorText?: string;
};

function labelForId(id: string): string {
  return SKILL_SUGGESTIONS.find((s) => s.value === id)?.label ?? humanizeSkillId(id);
}

export function SkillTagsInput({
  label,
  hint,
  required,
  values,
  excludeIds = [],
  onChange,
  single,
  singleValue = '',
  onSingleChange,
  invalid,
  errorText,
}: Props) {
  const [draft, setDraft] = useState('');

  const addTag = (raw: string) => {
    const id = resolveSkillId(raw);
    if (!id) return;
    if (excludeIds.includes(id)) return;
    if (single && onSingleChange) {
      onSingleChange(id);
      setDraft('');
      return;
    }
    if (values.includes(id)) return;
    onChange([...values, id]);
    setDraft('');
  };

  const displayValue = single ? singleValue : draft;
  const setDisplayValue = single ? () => {} : setDraft;

  return (
    <label className={styles.label}>
      <span>
        {label} {required ? <span className={styles.required}>*</span> : null}
      </span>
      {!single ? (
        <div className={styles.chips} style={{ marginBottom: 8 }}>
          {values.map((id) => (
            <button
              key={id}
              type="button"
              className={`${styles.chip} ${styles.chipActive}`}
              onClick={() => onChange(values.filter((v) => v !== id))}
              title="Quitar"
            >
              {labelForId(id)} ×
            </button>
          ))}
        </div>
      ) : null}
      <input
        className={`${styles.input} ${invalid ? styles.inputInvalid : ''}`}
        value={single ? labelForId(singleValue) || singleValue : displayValue}
        onChange={(e) => {
          if (single && onSingleChange) {
            onSingleChange(e.target.value);
          } else {
            setDisplayValue(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag(single ? singleValue : draft);
          }
        }}
        onBlur={() => {
          if (!single && draft.trim()) addTag(draft);
        }}
        placeholder={single ? 'Elegí o escribí una categoría…' : 'Escribí y Enter para agregar…'}
        list="skill-suggestions"
      />
      <datalist id="skill-suggestions">
        {SKILL_SUGGESTIONS.map((opt) => (
          <option key={opt.value} value={opt.label} />
        ))}
      </datalist>
      {invalid && errorText ? <span className={styles.errorText}>{errorText}</span> : null}
      <span className={styles.hint}>{hint}</span>
      <div className={styles.chips} style={{ marginTop: 8 }}>
        {SKILL_SUGGESTIONS.filter((opt) => !excludeIds.includes(opt.value) && (!single || opt.value !== singleValue))
          .map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.chip} ${styles.chipGhost} ${
                single && singleValue === opt.value ? styles.chipActive : ''
              } ${!single && values.includes(opt.value) ? styles.chipActive : ''}`}
              onClick={() => addTag(opt.label)}
            >
              {opt.label}
            </button>
          ))}
      </div>
    </label>
  );
}
