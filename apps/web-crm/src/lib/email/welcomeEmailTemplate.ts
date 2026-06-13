function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildWelcomeHtml(params: { displayName: string }): string {
  const name = escapeHtml(params.displayName);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>T2T Academy — Bienvenido/a</title>
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
              <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.12em;color:#4cc35b;text-transform:uppercase;">Bienvenida</p>
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:800;">¡Hola, ${name}!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;color:rgba(255,255,255,0.78);font-size:15px;line-height:1.6;text-align:center;">
              <p style="margin:0 0 16px;">Te damos la bienvenida a T2T Academy. Vas a entrenar las habilidades que transforman tu carrera con micro-rutinas diarias, retos y un sistema de progreso que te acompaña.</p>
              <p style="margin:0 0 16px;">Para arrancar fuerte:</p>
              <ul style="margin:0 0 16px;padding:0 0 0 20px;text-align:left;color:rgba(255,255,255,0.85);">
                <li style="margin-bottom:8px;">Completá tu diagnóstico inicial para personalizar tu plan.</li>
                <li style="margin-bottom:8px;">Hacé tu primera rutina y empezá tu racha diaria.</li>
                <li style="margin-bottom:0;">Activá las notificaciones para no perderte tu sesión.</li>
              </ul>
              <p style="margin:0;">Nos vemos en la app.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);">El equipo de T2T Academy</p>
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

export function buildWelcomeText(params: { displayName: string }): string {
  return `T2T Academy — Bienvenida

¡Hola, ${params.displayName}!

Te damos la bienvenida a T2T Academy. Vas a entrenar las habilidades que transforman tu carrera con micro-rutinas diarias, retos y un sistema de progreso que te acompaña.

Para arrancar fuerte:
- Completá tu diagnóstico inicial para personalizar tu plan.
- Hacé tu primera rutina y empezá tu racha diaria.
- Activá las notificaciones para no perderte tu sesión.

Nos vemos en la app.

El equipo de T2T Academy
© T2T Academy`;
}
