import { getResendClient } from './resendClient';
import {
  buildDiagnosticHtml,
  buildDiagnosticSubject,
  buildDiagnosticText,
  type DiagnosticEmailParams,
} from './diagnosticResultEmailTemplate';

export type SendDiagnosticResult = { ok: true; id: string } | { ok: false; error: string };

export async function sendDiagnosticResultEmail(params: {
  to: string;
  scores: Record<string, number>;
  topSkills: string[];
  weakSkills: string[];
}): Promise<SendDiagnosticResult> {
  const resend = getResendClient();
  const fromEmail = process.env.WAITLIST_FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.WAITLIST_FROM_NAME || 'T2T Academy';

  if (!resend || !fromEmail) {
    return { ok: false, error: 'Configuración de email incompleta (RESEND_API_KEY / WAITLIST_FROM_EMAIL)' };
  }

  const tplParams: DiagnosticEmailParams = {
    scores: params.scores,
    topSkills: params.topSkills,
    weakSkills: params.weakSkills,
  };

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [params.to],
    subject: buildDiagnosticSubject(tplParams),
    html: buildDiagnosticHtml(tplParams),
    text: buildDiagnosticText(tplParams),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.id) {
    return { ok: false, error: 'Resend no devolvió id de envío' };
  }

  return { ok: true, id: data.id };
}
