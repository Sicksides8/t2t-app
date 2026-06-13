/**
 * Plantilla del email de resultado del diagnostico de onboarding.
 *
 * IMPORTANTE: las constantes `SKILL_ORDER` y `SKILL_LABELS` se replican
 * desde `apps/mobile/src/data/diagnostic.ts` a proposito para no acoplar
 * los packages mobile y web-crm. Si se agrega/renombra una skill en el
 * mobile, hay que actualizar este archivo tambien.
 *
 * Disenio email-safe: layout con tablas + inline styles (no flex/grid),
 * compatible con la mayoria de clients (Gmail, Outlook, Apple Mail).
 */
import { escapeHtml } from './htmlUtils';

export const SKILL_ORDER = [
  'liderazgo',
  'influencia',
  'adaptabilidad',
  'comunicacion',
  'equipo',
  'resolucion',
  'creatividad',
  'escucha',
  'productividad',
  'aprendizaje',
  'liderazgoHumano',
  'gestionEmocional',
] as const;

export type DiagnosticSkillId = (typeof SKILL_ORDER)[number];

export const SKILL_LABELS: Record<DiagnosticSkillId, string> = {
  liderazgo: 'Liderazgo',
  influencia: 'Influencia',
  adaptabilidad: 'Adaptabilidad',
  comunicacion: 'Comunicación',
  equipo: 'Trabajo en equipo',
  resolucion: 'Resolución de problemas',
  creatividad: 'Creatividad',
  escucha: 'Escucha',
  productividad: 'Productividad',
  aprendizaje: 'Aprendizaje',
  liderazgoHumano: 'Liderazgo humano',
  gestionEmocional: 'Gestión emocional',
};

type Bucket = { label: string; color: string };

function bucketLabel(score: number): Bucket {
  if (score >= 80) return { label: 'Fortaleza', color: '#4cc35b' };
  if (score >= 50) return { label: 'En desarrollo', color: '#b73cef' };
  return { label: 'A entrenar', color: '#ffce5c' };
}

function clampScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function labelFor(skillId: string): string {
  return SKILL_LABELS[skillId as DiagnosticSkillId] || skillId;
}

function appUrl(): string {
  return (
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.EXPO_PUBLIC_APP_URL?.trim() ||
    'https://t2t-app.netlify.app'
  );
}

export type DiagnosticEmailParams = {
  scores: Record<string, number>;
  topSkills: string[];
  weakSkills: string[];
};

export function buildDiagnosticSubject(params: DiagnosticEmailParams): string {
  const top = params.topSkills[0];
  const topName = top ? labelFor(top) : 'tu perfil';
  return `Tu diagnóstico T2T: tu fuerte es ${topName}`;
}

function renderSkillRow(skillId: string, score: number): string {
  const name = escapeHtml(labelFor(skillId));
  const safeScore = clampScore(score);
  const bucket = bucketLabel(safeScore);
  // Las celdas con `width="..."` en porcentaje son la forma email-safe
  // de hacer una barra de progreso (Outlook ignora width:% en CSS).
  return `<tr>
  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:0 0 6px;color:#ffffff;font-size:13px;font-weight:700;">${name}</td>
        <td style="padding:0 0 6px;text-align:right;color:rgba(255,255,255,0.62);font-size:12px;font-weight:600;">${safeScore}<span style="color:rgba(255,255,255,0.32);font-weight:500;">/100</span></td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;">
      <tr>
        <td width="${safeScore}%" style="background:${bucket.color};height:8px;line-height:8px;font-size:0;">&nbsp;</td>
        <td width="${100 - safeScore}%" style="height:8px;line-height:8px;font-size:0;">&nbsp;</td>
      </tr>
    </table>
    <p style="margin:6px 0 0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${bucket.color};">${bucket.label}</p>
  </td>
</tr>`;
}

function renderHighlightCard(opts: {
  title: string;
  accent: string;
  skills: { id: string; score: number }[];
}): string {
  const rows = opts.skills
    .map((s) => {
      const name = escapeHtml(labelFor(s.id));
      const score = clampScore(s.score);
      return `<tr>
  <td style="padding:6px 0;color:#ffffff;font-size:14px;font-weight:600;">${name}</td>
  <td style="padding:6px 0;text-align:right;color:rgba(255,255,255,0.62);font-size:13px;font-weight:600;">${score}<span style="color:rgba(255,255,255,0.32);font-weight:500;">/100</span></td>
</tr>`;
    })
    .join('');

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;background:rgba(255,255,255,0.04);border:1px solid ${opts.accent}55;border-radius:18px;margin-bottom:16px;">
  <tr>
    <td style="padding:18px 20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${opts.accent};">${escapeHtml(opts.title)}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${rows || '<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;">Sin datos suficientes.</td></tr>'}
      </table>
    </td>
  </tr>
</table>`;
}

export function buildDiagnosticHtml(params: DiagnosticEmailParams): string {
  const topId = params.topSkills[0];
  const weakId = params.weakSkills[0];
  const topName = escapeHtml(topId ? labelFor(topId) : 'tu perfil');
  const weakName = escapeHtml(weakId ? labelFor(weakId) : 'tu próxima oportunidad');

  const top3 = (params.topSkills || [])
    .slice(0, 3)
    .map((id) => ({ id, score: params.scores?.[id] ?? 0 }));
  const weak3 = (params.weakSkills || [])
    .slice(0, 3)
    .map((id) => ({ id, score: params.scores?.[id] ?? 0 }));

  const rows = SKILL_ORDER.map((id) => renderSkillRow(id, params.scores?.[id] ?? 0)).join('');

  const ctaUrl = escapeHtml(appUrl());

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>T2T Academy — Tu diagnóstico</title>
</head>
<body style="margin:0;padding:0;background:#1d083a;font-family:Poppins,Inter,system-ui,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#1d083a 0%,#3a1268 70%,#1d083a 100%);padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:rgba(42,16,82,0.92);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:32px 28px 8px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:18px;background:linear-gradient(135deg,#b73cef,#4cc35b);font-weight:900;font-size:18px;">T2T</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.12em;color:#4cc35b;text-transform:uppercase;">Tu diagnóstico</p>
              <h1 style="margin:0 0 8px;font-size:26px;line-height:1.25;font-weight:800;">Tu perfil hoy</h1>
              <p style="margin:0 0 20px;color:rgba(255,255,255,0.72);font-size:14px;line-height:1.55;">12 habilidades · una mirada honesta de dónde estás parado.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;background:linear-gradient(135deg,rgba(183,60,239,0.18),rgba(76,195,91,0.16));border:1px solid rgba(183,60,239,0.45);border-radius:18px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#ffce5c;">Tu lectura</p>
                    <p style="margin:0;font-size:16px;line-height:1.5;color:#ffffff;font-weight:600;">Tu fuerte es <span style="color:#4cc35b;">${topName}</span>. Empezamos por entrenar <span style="color:#b73cef;">${weakName}</span>, tu mayor oportunidad.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 0;">
              ${renderHighlightCard({ title: 'Top 3 fortalezas', accent: '#4cc35b', skills: top3 })}
              ${renderHighlightCard({ title: 'Top 3 a entrenar', accent: '#ffce5c', skills: weak3 })}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Tu radar completo</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;text-align:center;">
              <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(135deg,#b73cef,#7a22b5);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;">Crear mi cuenta y empezar</a>
              <p style="margin:14px 0 0;font-size:12px;color:rgba(255,255,255,0.55);">Tu plan personalizado te espera del otro lado.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);">Recibís este email porque hiciste el diagnóstico inicial en T2T Academy.</p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">© T2T Academy</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildDiagnosticText(params: DiagnosticEmailParams): string {
  const topId = params.topSkills[0];
  const weakId = params.weakSkills[0];
  const topName = topId ? labelFor(topId) : 'tu perfil';
  const weakName = weakId ? labelFor(weakId) : 'tu próxima oportunidad';

  const radarLines = SKILL_ORDER.map((id) => {
    const score = clampScore(params.scores?.[id] ?? 0);
    const bucket = bucketLabel(score).label;
    return `- ${labelFor(id)}: ${score}/100 (${bucket})`;
  }).join('\n');

  const top3 = (params.topSkills || [])
    .slice(0, 3)
    .map((id) => `- ${labelFor(id)}: ${clampScore(params.scores?.[id] ?? 0)}/100`)
    .join('\n');
  const weak3 = (params.weakSkills || [])
    .slice(0, 3)
    .map((id) => `- ${labelFor(id)}: ${clampScore(params.scores?.[id] ?? 0)}/100`)
    .join('\n');

  return `T2T Academy — Tu diagnóstico

Tu perfil hoy. 12 habilidades, una mirada honesta de dónde estás parado.

Tu lectura: tu fuerte es ${topName}. Empezamos por entrenar ${weakName}, tu mayor oportunidad.

Top 3 fortalezas:
${top3 || '- (sin datos suficientes)'}

Top 3 a entrenar:
${weak3 || '- (sin datos suficientes)'}

Tu radar completo:
${radarLines}

Crear mi cuenta y empezar: ${appUrl()}

Recibís este email porque hiciste el diagnóstico inicial en T2T Academy.
© T2T Academy`;
}
