function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildStreakWarningHtml(params: { displayName: string; currentStreak: number }): string {
  const name = escapeHtml(params.displayName);
  const streak = Math.max(1, Math.floor(params.currentStreak || 1));
  const streakLabel = streak === 1 ? 'día' : 'días';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>T2T Academy — Tu racha está en peligro</title>
</head>
<body style="margin:0;padding:0;background:#1d083a;font-family:Poppins,Inter,system-ui,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#1d083a 0%,#3a1268 70%,#1d083a 100%);padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:rgba(42,16,82,0.92);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:32px 28px 8px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:18px;background:linear-gradient(135deg,#ff7a1a,#b73cef);font-weight:900;font-size:24px;">🔥</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.12em;color:#ff7a1a;text-transform:uppercase;">Tu racha está en peligro</p>
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:800;">${name}, te quedan horas</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;color:rgba(255,255,255,0.78);font-size:15px;line-height:1.6;text-align:center;">
              <p style="margin:0 0 16px;">Llevás <strong style="color:#ffffff;">${streak} ${streakLabel}</strong> seguidos entrenando. Si no hacés tu sesión hoy, perdés la racha al cambio de día.</p>
              <p style="margin:0 0 16px;">Solo te toma unos minutos. Abrí la app y mantené el envión.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 32px;text-align:center;">
              <a href="t2tacademy://" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(135deg,#b73cef,#4cc35b);color:#ffffff;font-weight:700;text-decoration:none;font-size:15px;">Mantener mi racha</a>
              <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.45);">El equipo de T2T Academy</p>
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

export function buildStreakWarningText(params: { displayName: string; currentStreak: number }): string {
  const streak = Math.max(1, Math.floor(params.currentStreak || 1));
  const streakLabel = streak === 1 ? 'día' : 'días';
  return `T2T Academy — Tu racha está en peligro

${params.displayName}, te quedan horas.

Llevás ${streak} ${streakLabel} seguidos entrenando. Si no hacés tu sesión hoy, perdés la racha al cambio de día.

Abrí la app y mantené el envión: t2tacademy://

El equipo de T2T Academy
© T2T Academy`;
}

export function buildStreakWarningSubject(currentStreak: number): string {
  const streak = Math.max(1, Math.floor(currentStreak || 1));
  const streakLabel = streak === 1 ? 'día' : 'días';
  return `Tu racha de ${streak} ${streakLabel} está en peligro`;
}
