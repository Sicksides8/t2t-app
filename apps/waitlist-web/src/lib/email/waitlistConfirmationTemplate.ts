export function buildWaitlistConfirmationHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>T2T Academy — Lista de espera</title>
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
              <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.12em;color:#4cc35b;text-transform:uppercase;">Lista de espera</p>
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:800;">¡Ya estás en la lista!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 32px;color:rgba(255,255,255,0.75);font-size:15px;line-height:1.6;text-align:center;">
              <p style="margin:0 0 16px;">Gracias por sumarte a T2T Academy. Guardamos tu lugar para la beta cerrada.</p>
              <p style="margin:0;">Te escribiremos cuando habilitemos tu acceso para descargar la app y empezar a entrenar las habilidades que transforman tu carrera.</p>
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

export function buildWaitlistConfirmationText(): string {
  return `T2T Academy — Lista de espera

¡Ya estás en la lista! Gracias por sumarte a T2T Academy.

Te avisaremos cuando habilitemos tu acceso a la beta cerrada.

© T2T Academy`;
}
