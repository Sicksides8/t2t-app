import { AppShell } from './layout/AppShell';
import styles from '../app/dashboard.module.css';

export function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <AppShell title={title}>
      <section className={styles.panel}>
        <p className={styles.description}>{description}</p>
        <p className={styles.muted}>Modulo planificado para una siguiente iteracion del CRM.</p>
      </section>
    </AppShell>
  );
}
