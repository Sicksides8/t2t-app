import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Datos para emitir un certificado en PDF.
 * Si `earnedAt` no se provee, se usa la fecha actual.
 */
export type CertificatePdfData = {
  userName: string;
  courseTitle: string;
  earnedAt?: Date;
  certificateId?: string;
};

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function sanitizeForFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * HTML del diploma. Replica los estilos del `certCard` que se ven en pantalla
 * (fondo crema, borde dorado/verde T2T, marca, nombre, curso y firma).
 * Optimizado para imprimirse en A4 horizontal (landscape).
 */
function buildCertificateHtml(data: CertificatePdfData): string {
  const earnedAt = data.earnedAt ?? new Date();
  const dateLabel = formatLongDate(earnedAt);
  const idLabel = data.certificateId ? `ID · ${data.certificateId}` : '';

  // Colores tomados de theme/colors.ts:
  // - cream:           #F7F1E1
  // - accentHighlight: #4CC35B (verde T2T, usado como "dorado" de la marca)
  // - accentPrimary:   #B73CEF
  // - textOnCream:     #1A0030
  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certificado T2T Academy</title>
    <style>
      @page { size: A4 landscape; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #1A0030;
        background: #1D083A;
        width: 297mm;
        height: 210mm;
      }
      .page {
        width: 297mm;
        height: 210mm;
        padding: 18mm;
        position: relative;
      }
      .card {
        position: relative;
        background: #F7F1E1;
        border: 8px solid #4CC35B;
        border-radius: 24px;
        height: 100%;
        padding: 28mm 24mm 22mm;
        box-shadow: 0 18px 40px rgba(0,0,0,0.35);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        overflow: hidden;
      }
      .card::before {
        content: '';
        position: absolute;
        top: -120px; right: -120px;
        width: 320px; height: 320px;
        border-radius: 50%;
        background: rgba(76, 195, 91, 0.12);
      }
      .card::after {
        content: '';
        position: absolute;
        bottom: -160px; left: -160px;
        width: 360px; height: 360px;
        border-radius: 50%;
        background: rgba(183, 60, 239, 0.10);
      }
      .seal {
        position: absolute;
        top: 18mm;
        right: 18mm;
        width: 62px;
        height: 62px;
        border-radius: 50%;
        background: #4CC35B;
        border: 4px solid #F7F1E1;
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        font-weight: 900;
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
      .brand {
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 6px;
        color: #1A0030;
        margin-top: 6mm;
      }
      .script {
        font-family: 'Brush Script MT', 'Snell Roundhand', cursive;
        font-size: 84px;
        color: #4CC35B;
        line-height: 1;
        margin: 8mm 0 2mm;
        font-style: italic;
      }
      .caption {
        color: #777777;
        font-size: 14px;
        letter-spacing: 1px;
        margin: 6mm 0 3mm;
      }
      .name {
        font-size: 48px;
        font-weight: 900;
        color: #1A0030;
        margin: 0;
        line-height: 1.1;
      }
      .course {
        font-size: 26px;
        font-weight: 800;
        color: #4CC35B;
        margin: 2mm 0 0;
        line-height: 1.2;
        max-width: 220mm;
      }
      .footer {
        margin-top: auto;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .meta {
        text-align: left;
        font-size: 12px;
        color: #555555;
      }
      .meta .date {
        font-weight: 700;
        color: #1A0030;
        font-size: 13px;
        margin-bottom: 2px;
      }
      .signature-block {
        text-align: right;
      }
      .signature {
        font-family: 'Brush Script MT', 'Snell Roundhand', cursive;
        font-style: italic;
        font-size: 44px;
        color: #1A0030;
        line-height: 1;
      }
      .signature-line {
        margin-top: 4px;
        width: 220px;
        border-bottom: 1.5px solid #1A0030;
      }
      .signature-label {
        font-size: 12px;
        color: #555555;
        letter-spacing: 1px;
        margin-top: 4px;
      }
      .id-label {
        position: absolute;
        bottom: 8mm;
        left: 50%;
        transform: translateX(-50%);
        font-size: 9px;
        color: #999999;
        letter-spacing: 2px;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="card">
        <div class="seal">★</div>
        <div class="brand">T2T ACADEMY</div>
        <div class="script">Certificado</div>
        <div class="caption">OTORGADO A</div>
        <h1 class="name">${escapeHtml(data.userName)}</h1>
        <div class="caption">por completar el curso</div>
        <div class="course">${escapeHtml(data.courseTitle)}</div>

        <div class="footer">
          <div class="meta">
            <div class="date">${escapeHtml(dateLabel)}</div>
            <div>Fecha de emisión</div>
          </div>
          <div class="signature-block">
            <div class="signature">Gustavo R.</div>
            <div class="signature-line"></div>
            <div class="signature-label">DIRECTOR T2T ACADEMY</div>
          </div>
        </div>
        ${idLabel ? `<div class="id-label">${escapeHtml(idLabel)}</div>` : ''}
      </div>
    </div>
  </body>
</html>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Genera un PDF a partir del HTML del diploma usando expo-print.
 * Devuelve el URI local del archivo.
 */
export async function generateCertificatePdf(data: CertificatePdfData): Promise<string> {
  const html = buildCertificateHtml(data);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    width: 842, // A4 landscape (297mm * 72/25.4)
    height: 595, // A4 landscape (210mm * 72/25.4)
  });

  // Renombrar el archivo a algo legible (impacta el nombre que ve el usuario
  // al guardar / compartir desde la sheet del SO).
  try {
    const safeCourse = sanitizeForFilename(data.courseTitle) || 'curso';
    const source = new File(uri);
    const target = new File(Paths.cache, `certificado-t2t-${safeCourse}.pdf`);
    if (target.exists) target.delete();
    source.move(target);
    return target.uri;
  } catch {
    return uri;
  }
}

/**
 * Genera el PDF y dispara el flujo nativo de compartir (incluye descargar/guardar).
 * Si `Sharing` no está disponible en el dispositivo (raro), devuelve el URI igual.
 */
export async function generateAndShareCertificatePdf(data: CertificatePdfData): Promise<string> {
  const uri = await generateCertificatePdf(data);
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Certificado T2T Academy',
      UTI: Platform.OS === 'ios' ? 'com.adobe.pdf' : undefined,
    });
  }
  return uri;
}
