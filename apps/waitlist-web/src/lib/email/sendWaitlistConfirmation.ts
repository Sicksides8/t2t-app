import { Resend } from 'resend';
import { buildWaitlistConfirmationHtml, buildWaitlistConfirmationText } from './waitlistConfirmationTemplate';
import { getResendClient } from './resendClient';

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

export async function sendWaitlistConfirmationEmail(to: string): Promise<SendEmailResult> {
  const resend = getResendClient();
  const fromEmail = process.env.WAITLIST_FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.WAITLIST_FROM_NAME || 'T2T Academy';

  if (!resend || !fromEmail) {
    return { ok: false, error: 'Configuración de email incompleta (RESEND_API_KEY / WAITLIST_FROM_EMAIL)' };
  }

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [to],
    subject: 'T2T Academy — Confirmación de lista de espera',
    html: buildWaitlistConfirmationHtml(),
    text: buildWaitlistConfirmationText(),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.id) {
    return { ok: false, error: 'Resend no devolvió id de envío' };
  }

  return { ok: true, id: data.id };
}
