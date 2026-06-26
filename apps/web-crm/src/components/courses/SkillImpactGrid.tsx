'use client';

import { DIAGNOSTIC_SKILL_IDS, skillImpactCoverage } from '../../lib/courseFields';
import { SKILL_SUGGESTIONS } from '../../lib/courseConstants';
import styles from './CourseModal.module.css';

type Props = {
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
};

function labelForId(id: string): string {
  return SKILL_SUGGESTIONS.find((s) => s.value === id)?.label ?? id;
}

export function SkillImpactGrid({ value, onChange }: Props) {
  const coverage = skillImpactCoverage(value);

  return (
    <div>
      <p className={styles.hint} style={{ marginBottom: 12 }}>
        Porcentaje de impacto sobre cada habilidad al completar el curso (actualiza la araña). No
        confundir con los tags de clasificación.
      </p>
      <div className={styles.fieldGrid}>
        {DIAGNOSTIC_SKILL_IDS.map((skillId) => {
          const pct = Math.round((value[skillId] ?? 0) * 1000) / 10;
          return (
            <label key={skillId} className={styles.label}>
              <span>{labelForId(skillId)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  className={styles.input}
                  min={0}
                  max={100}
                  step={0.1}
                  value={pct || ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? 0 : Number(raw);
                    const g = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) / 100 : 0;
                    onChange({ ...value, [skillId]: g });
                  }}
                  placeholder="0"
                />
                <span className={styles.hint} style={{ margin: 0, whiteSpace: 'nowrap' }}>
                  %
                </span>
              </div>
            </label>
          );
        })}
      </div>
      <p className={styles.hint} style={{ marginTop: 8 }}>
        Cobertura Σ: {Math.round(coverage * 1000) / 10}% (referencia Excel)
      </p>
    </div>
  );
}
