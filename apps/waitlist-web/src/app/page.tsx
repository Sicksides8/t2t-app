'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, Target } from 'lucide-react';
import { FormEvent, useState } from 'react';
import styles from './page.module.css';

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

function validateEmailClient(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Ingresá tu correo electrónico.';
  if (trimmed.length > 254) return 'El correo es demasiado largo.';
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Ingresá un correo electrónico válido (ejemplo: nombre@dominio.com).';
  }
  return null;
}

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);

    const clientError = validateEmailClient(email);
    if (clientError) {
      setError(clientError);
      setSuccess('');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const form = event.currentTarget;
    const website = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), website, source: 'landing' }),
      });

      const data = (await response.json()) as { success?: boolean; message?: string; error?: string };

      if (!response.ok) {
        setError(data.error || 'No pudimos registrarte. Intentá de nuevo.');
        return;
      }

      setSuccess(data.message || '¡Listo! Te notificaremos por email cuando tu acceso esté listo.');
      setEmail('');
      setTouched(false);
    } catch {
      setError('Error de conexión. Revisá tu internet e intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const showInputError = touched && Boolean(validateEmailClient(email));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>T2T</div>
        <span className={styles.badge}>Beta cerrada</span>
      </header>

      <main className={styles.hero}>
        <motion.section
          className={styles.copy}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.badge}>T2T Academy</span>
          <h1>
            Entrená las habilidades que <span>transforman tu carrera</span>
          </h1>
          <p className={styles.lead}>
            Sumate a la lista de espera y sé de los primeros en acceder a la beta cerrada: tu academia
            personal de competencias humanas, con diagnóstico, cursos cortos y progreso medible.
          </p>
          <ul className={styles.features}>
            <li>
              <span className={styles.featureIcon}>
                <Target size={16} />
              </span>
              Diagnóstico inicial y plan personalizado según tus objetivos
            </li>
            <li>
              <span className={styles.featureIcon}>
                <Brain size={16} />
              </span>
              Cursos breves sobre habilidades que definen tu crecimiento profesional
            </li>
            <li>
              <span className={styles.featureIcon}>
                <Sparkles size={16} />
              </span>
              Rachas, logros y T2T Coins para mantener la motivación
            </li>
          </ul>
        </motion.section>

        <motion.section
          className={styles.card}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <span className={styles.cardLabel}>Lista de espera</span>
          <h2>Reservá tu lugar</h2>
          <p className={styles.cardDesc}>
            Dejanos tu email y te avisamos cuando habilitemos tu acceso a la app en Google Play.
          </p>

          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <label className={styles.honeypot} htmlFor="website">
              No completar
            </label>
            <input
              id="website"
              className={styles.honeypot}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />

            <input
              className={`${styles.input} ${showInputError ? styles.inputError : ''}`}
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched) setError(validateEmailClient(e.target.value) || '');
              }}
              onBlur={() => {
                setTouched(true);
                setError(validateEmailClient(email) || '');
              }}
              autoComplete="email"
              inputMode="email"
              disabled={submitting}
              aria-invalid={showInputError || Boolean(error)}
              aria-describedby={error || success ? 'form-feedback' : undefined}
            />

            <button className={styles.submit} type="submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Unirme a la lista'}
            </button>

            <p id="form-feedback" className={styles.message} role="status">
              {error ? <span className={styles.messageError}>{error}</span> : null}
              {!error && success ? <span className={styles.messageSuccess}>{success}</span> : null}
            </p>
          </form>

          <p className={styles.finePrint}>
            Sin spam. Solo te escribiremos para avisarte del acceso a la beta y novedades relevantes de
            T2T Academy.
          </p>
        </motion.section>
      </main>

      <footer className={styles.footer}>© {new Date().getFullYear()} T2T Academy</footer>
    </div>
  );
}
