import { buildBetaInviteHtml, buildBetaInviteText } from './betaInviteTemplate';
import { getResendClient } from './resendClient';

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

export async function sendBetaInviteEmail(to: string): Promise<SendEmailResult> {
  const resend = getResendClient();
  const fromEmail = process.env.WAITLIST_FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.WAITLIST_FROM_NAME || 'T2T Academy';
  const playStoreUrl = process.env.PLAY_STORE_URL;
  const appStoreUrl = process.env.APP_STORE_URL?.trim() || undefined;

  if (!resend || !fromEmail) {
    return { ok: false, error: 'Configuración de email incompleta (RESEND_API_KEY / WAITLIST_FROM_EMAIL)' };
  }

  if (!playStoreUrl) {
    return { ok: false, error: 'PLAY_STORE_URL no configurada' };
  }

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [to],
    subject: 'T2T Academy — Ya podés acceder a la beta cerrada',
    html: buildBetaInviteHtml({ playStoreUrl, appStoreUrl }),
    text: buildBetaInviteText({ playStoreUrl, appStoreUrl }),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.id) {
    return { ok: false, error: 'Resend no devolvió id de envío' };
  }

  return { ok: true, id: data.id };
}
