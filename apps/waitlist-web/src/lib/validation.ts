const EMAIL_MAX_LENGTH = 254;
const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export type EmailValidationResult =
  | { ok: true; email: string }
  | { ok: false; code: 'empty' | 'too_long' | 'invalid_format' | 'invalid_chars' };

export function normalizeAndValidateEmail(raw: unknown): EmailValidationResult {
  if (typeof raw !== 'string') {
    return { ok: false, code: 'empty' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, code: 'empty' };
  }

  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return { ok: false, code: 'too_long' };
  }

  if (CONTROL_CHARS.test(trimmed)) {
    return { ok: false, code: 'invalid_chars' };
  }

  const email = trimmed.toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, code: 'invalid_format' };
  }

  return { ok: true, email };
}

export function waitlistDocId(email: string): string {
  return email.replace(/\./g, '_dot_').replace(/@/g, '_at_');
}

export function emailValidationMessage(code: Exclude<EmailValidationResult, { ok: true }>['code']): string {
  switch (code) {
    case 'empty':
      return 'Ingresá tu correo electrónico.';
    case 'too_long':
      return 'El correo es demasiado largo.';
    case 'invalid_chars':
      return 'El correo contiene caracteres no válidos.';
    case 'invalid_format':
      return 'Ingresá un correo electrónico válido (ejemplo: nombre@dominio.com).';
    default:
      return 'Correo no válido.';
  }
}
