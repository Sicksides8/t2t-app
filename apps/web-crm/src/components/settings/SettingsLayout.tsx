'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlayCircle } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { AppShell } from '../layout/AppShell';
import styles from './SettingsLayout.module.css';

type SubItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
};

/** Subsecciones del panel /settings. Hardcoded por ahora; cuando crezca
 *  conviene moverlas a un config compartido. */
const items: SubItem[] = [
  { href: '/settings/welcome-video', label: 'Video de bienvenida', icon: PlayCircle },
];

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppShell title="Settings">
      <div className={styles.wrap}>
        <aside className={styles.subnav}>
          <div className={styles.subnavTitle}>Categorias</div>
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.subnavItem} ${active ? styles.subnavItemActive : ''}`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </aside>
        <div className={styles.body}>{children}</div>
      </div>
    </AppShell>
  );
}
