'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  BarChart3,
  Bell,
  BookOpen,
  Gift,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Tags,
  Users,
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AppShell.module.css';

const items = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Alumnos', icon: Users },
  { href: '/courses', label: 'Cursos', icon: BookOpen },
  { href: '/skills', label: 'Habilidades', icon: Tags },
  { href: '/subscriptions', label: 'Suscripciones', icon: GraduationCap },
  { href: '/codes', label: 'Codigos', icon: Gift },
  { href: '/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children, title = 'T2T Academy CRM' }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const { firebaseUser } = useAuth();

  async function logout() {
    if (auth) await signOut(auth);
    router.replace('/login');
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.logo}>T2T</div>
          <div>
            <strong>Academy</strong>
            <span>CRM</span>
          </div>
        </div>
        <nav className={styles.nav}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href} className={styles.navItem}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className={styles.content}>
        <header className={styles.header}>
          <div>
            <span className={styles.kicker}>Firestore + API routes</span>
            <h1>{title}</h1>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.pill}>
              <BarChart3 size={16} />
              {firebaseUser?.email || 'Admin'}
            </div>
            <button type="button" className={styles.logout} onClick={logout}>
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
