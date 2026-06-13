import styles from '../../app/dashboard.module.css';

export type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <article className={styles.card}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <span style={{ marginTop: 6, display: 'block', fontSize: 12 }}>{hint}</span> : null}
    </article>
  );
}
