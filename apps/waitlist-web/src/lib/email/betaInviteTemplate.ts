type BetaInviteParams = {
  playStoreUrl: string;
  appStoreUrl?: string;
};

export function buildBetaInviteHtml({ playStoreUrl, appStoreUrl }: BetaInviteParams): string {
  const storeButtons = [
    `<a href="${escapeHtml(playStoreUrl)}" style="display:inline-block;margin:6px;padding:14px 22px;border-radius:999px;background:linear-gradient(90deg,#b73cef,#4cc35b);color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;">Google Play</a>`,
  ];

  if (appStoreUrl) {
    storeButtons.push(
      `<a href="${escapeHtml(appStoreUrl)}" style="display:inline-block;margin:6px;padding:14px 22px;border-radius:999px;border:1px solid rgba(255,255,255,0.25);color:#ffffff;font-weight:800;font-size:14px;text-decoration:none;">App Store</a>`,
    );
  }

  const linkLines = [`Google Play: ${playStoreUrl}`];
  if (appStoreUrl) {
    linkLines.push(`App Store: ${appStoreUrl}`);
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>T2T Academy — Acceso a la beta</title>
</head>
<body style="margin:0;padding:0;background:#1d083a;font-family:Poppins,Inter,system-ui,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#1d083a 0%,#3a1268 70%,#1d083a 100%);padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:rgba(42,16,82,0.92);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:32px 28px 8px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:18px;background:linear-gradient(135deg,#b73cef,#4cc35b);font-weight:900;font-size:18px;">T2T</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.12em;color:#4cc35b;text-transform:uppercase;">Beta cerrada</p>
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:800;">Ya podés acceder a T2T Academy</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;color:rgba(255,255,255,0.75);font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px;">Tu lugar en la lista de espera fue confirmado. Descargá la app y empezá a entrenar las habilidades que transforman tu carrera.</p>
              <p style="margin:0;">Completá tu diagnóstico inicial para recibir tu plan personalizado.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 32px;text-align:center;">
              ${storeButtons.join('')}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-size:12px;line-height:1.5;color:rgba(255,255,255,0.45);text-align:center;">
              ${linkLines.map((line) => escapeHtml(line)).join('<br />')}
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

export function buildBetaInviteText({ playStoreUrl, appStoreUrl }: BetaInviteParams): string {
  const lines = [
    'T2T Academy — Acceso a la beta cerrada',
    '',
    'Ya podés acceder a T2T Academy. Descargá la app y empezá a entrenar las habilidades que transforman tu carrera.',
    '',
    `Google Play: ${playStoreUrl}`,
  ];
  if (appStoreUrl) {
    lines.push(`App Store: ${appStoreUrl}`);
  }
  lines.push('', '© T2T Academy');
  return lines.join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
