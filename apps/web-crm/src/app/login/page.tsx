'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, loading, isAdmin, refreshRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && firebaseUser && isAdmin) {
      router.replace('/');
    }
  }, [firebaseUser, isAdmin, loading, router]);

  async function submit() {
    if (!auth) {
      setMessage('Configura Firebase en .env.local (NEXT_PUBLIC_FIREBASE_*)');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await refreshRole();
      setMessage('Sesion iniciada. Verificando permisos...');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo iniciar sesion');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.logo}>T2T</div>
        <span>CRM ADMIN</span>
        <h1>Acceso T2T Academy</h1>
        <input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input
          placeholder="Contrasena"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button onClick={submit} disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
        {!loading && firebaseUser && !isAdmin ? (
          <p className={styles.error}>
            Tu usuario no tiene rol admin en t2t_users. Actualiza el campo role en Firestore.
          </p>
        ) : null}
        {message ? <p>{message}</p> : null}
      </section>
    </main>
  );
}
