'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { clearAdminAuth, getAdminAuthHeader, setAdminAuthHeader } from '@/lib/adminSession';
import { fetchWaitlist, inviteTester, type WaitlistItem } from '@/lib/adminApi';
import { formatDate } from '@/lib/format';
import styles from './admin.module.css';

type FilterStatus = 'pending' | 'invited';

export default function WaitlistAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [status, setStatus] = useState<FilterStatus>('pending');
  const [rows, setRows] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [invitingEmail, setInvitingEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const items = await fetchWaitlist(status);
      setRows(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar';
      if (message.includes('incorrectos') || message.includes('Sesión')) {
        clearAdminAuth();
        setAuthed(false);
      }
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (!getAdminAuthHeader()) {
      setCheckingSession(false);
      return;
    }
    setAuthed(true);
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    if (authed) {
      void load();
    }
  }, [authed, load]);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setLoginSubmitting(true);
    setLoginError('');
    setAdminAuthHeader(user.trim(), password);

    try {
      await fetchWaitlist('pending');
      setAuthed(true);
      setPassword('');
    } catch (err) {
      clearAdminAuth();
      setLoginError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoginSubmitting(false);
    }
  }

  function logout() {
    clearAdminAuth();
    setAuthed(false);
    setRows([]);
  }

  async function invite(email: string) {
    setInvitingEmail(email);
    setError(null);
    setActionMessage(null);
    try {
      await inviteTester(email);
      setActionMessage(`Invitación enviada a ${email}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la invitación');
    } finally {
      setInvitingEmail(null);
    }
  }

  if (checkingSession) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>Cargando...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className={styles.page}>
        <form className={styles.loginCard} onSubmit={onLogin}>
          <div className={styles.logo}>T2T</div>
          <h1 style={{ margin: 0 }}>Panel waitlist</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Acceso interno para gestionar la lista de espera e invitar a la beta.
          </p>
          <label htmlFor="admin-user">Usuario</label>
          <input
            id="admin-user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            required
          />
          <label htmlFor="admin-password">Contraseña</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" disabled={loginSubmitting}>
            {loginSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
          {loginError ? <p className={styles.error}>{loginError}</p> : null}
          <Link href="/" className={styles.backLink}>
            Volver a la landing
          </Link>
        </form>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className={styles.logo}>T2T</div>
          <div>
            <h1>Lista de espera</h1>
            <p>Gestioná leads e invitaciones a la beta cerrada.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/" className={styles.ghostBtn}>
            Landing
          </Link>
          <button type="button" className={styles.ghostBtn} onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <label className={styles.status} htmlFor="filter-status">
            Ver:
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as FilterStatus)}
          >
            <option value="pending">Pendientes</option>
            <option value="invited">Invitados</option>
          </select>
          <button type="button" className={styles.primaryBtn} onClick={() => void load()}>
            Actualizar
          </button>
        </div>

        {actionMessage ? <p className={styles.success}>{actionMessage}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {loading ? <p className={styles.status}>Cargando datos...</p> : null}

        {!loading ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Estado</th>
                <th>Origen</th>
                <th>Registro</th>
                <th>Invitado</th>
                {status === 'pending' ? <th>Acción</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={status === 'pending' ? 6 : 5} className={styles.empty}>
                    {status === 'pending'
                      ? 'No hay registros pendientes.'
                      : 'Aún no hay invitados.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.email}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${row.status === 'invited' ? styles.badgeInvited : ''}`}
                      >
                        {row.status === 'invited' ? 'Invitado' : 'Pendiente'}
                      </span>
                    </td>
                    <td>{row.source || '—'}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{formatDate(row.invitedAt)}</td>
                    {status === 'pending' ? (
                      <td>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          disabled={invitingEmail === row.email}
                          onClick={() => void invite(row.email)}
                        >
                          {invitingEmail === row.email ? 'Enviando...' : 'Invitar a beta'}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}
      </section>
    </main>
  );
}
