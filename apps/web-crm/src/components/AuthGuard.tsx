'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../app/dashboard.module.css';

const PUBLIC_PATHS = ['/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser, loading, isAdmin } = useAuth();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading || isPublic) return;
    if (!firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, isPublic, loading, router]);

  if (isPublic) return <>{children}</>;

  if (loading) {
    return (
      <main className={styles.centered}>
        <p>Cargando sesion...</p>
      </main>
    );
  }

  if (!firebaseUser) {
    return (
      <main className={styles.centered}>
        <p>Redirigiendo al login...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className={styles.centered}>
        <section className={styles.panel}>
          <h1>Acceso restringido</h1>
          <p>
            Tu cuenta no tiene rol <strong>admin</strong> en <code>t2t_users</code>. Pide a un administrador que
            actualice tu perfil en Firestore.
          </p>
          <Link href="/login" className={styles.linkButton}>
            Volver al login
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
