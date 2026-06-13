/**
 * Parser WebVTT mínimo, suficiente para los archivos que el cliente sube
 * desde el CRM. Soporta:
 *  - Header `WEBVTT` (con o sin BOM, con o sin metadata extra en la línea).
 *  - Bloques con timestamp `HH:MM:SS.mmm --> HH:MM:SS.mmm` o `MM:SS.mmm`.
 *  - Texto plano multi-línea (las líneas se unen con `\n`).
 *
 * Ignora explícitamente: cue settings (line:, position:, align:),
 * NOTE blocks, STYLE blocks, REGION blocks, voice tags <v>, etc.
 * El renderer del overlay quita los tags HTML que pudieran quedar.
 */

export type VttCue = {
  /** Inicio en segundos. */
  start: number;
  /** Fin en segundos. */
  end: number;
  /** Texto de la cue, ya limpio de tags HTML/VTT. */
  text: string;
};

const TIMESTAMP_RE =
  /^(?:(\d{1,3}):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})\s+-->\s+(?:(\d{1,3}):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})/;

function timestampToSeconds(h: string | undefined, m: string, s: string, ms: string): number {
  const hours = h ? Number(h) : 0;
  const minutes = Number(m);
  const seconds = Number(s);
  const millis = Number(ms.padEnd(3, '0').slice(0, 3));
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

function stripTags(line: string): string {
  // Quitamos tags estilo VTT/HTML simples: <c>, <v Speaker>, <i>, <b>, etc.
  return line.replace(/<[^>]+>/g, '');
}

export function parseVtt(raw: string): VttCue[] {
  if (!raw) return [];
  // Eliminamos BOM y normalizamos line endings.
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');

  const cues: VttCue[] = [];
  let i = 0;
  // Saltamos cabecera WEBVTT y metadata previa al primer bloque.
  if (lines[0]?.trim().toUpperCase().startsWith('WEBVTT')) {
    i = 1;
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    // Bloques especiales que ignoramos completos hasta línea en blanco.
    if (
      line === '' ||
      line.startsWith('NOTE') ||
      line.startsWith('STYLE') ||
      line.startsWith('REGION')
    ) {
      i += 1;
      continue;
    }

    // Una línea opcional de "cue identifier" antes del timestamp.
    let timestampLine = line;
    if (!TIMESTAMP_RE.test(timestampLine)) {
      i += 1;
      if (i >= lines.length) break;
      timestampLine = lines[i].trim();
      if (!TIMESTAMP_RE.test(timestampLine)) {
        // No era un cue válido; seguimos avanzando.
        i += 1;
        continue;
      }
    }

    const m = TIMESTAMP_RE.exec(timestampLine);
    if (!m) {
      i += 1;
      continue;
    }
    const start = timestampToSeconds(m[1], m[2], m[3], m[4]);
    const end = timestampToSeconds(m[5], m[6], m[7], m[8]);

    i += 1;
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(stripTags(lines[i]));
      i += 1;
    }

    const cueText = textLines.join('\n').trim();
    if (cueText && end > start) {
      cues.push({ start, end, text: cueText });
    }
    i += 1;
  }

  return cues.sort((a, b) => a.start - b.start);
}

/**
 * Encuentra la cue activa en el tiempo `t` (segundos). Devuelve null si
 * ninguna cue cubre ese punto. Implementación con búsqueda binaria para
 * archivos largos.
 */
export function findCue(cues: VttCue[], t: number): VttCue | null {
  if (!cues.length) return null;
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cue = cues[mid];
    if (t < cue.start) {
      hi = mid - 1;
    } else if (t > cue.end) {
      lo = mid + 1;
    } else {
      return cue;
    }
  }
  return null;
}
