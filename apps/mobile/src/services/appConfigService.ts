/**
 * App-wide remote config (t2t_config/app).
 *
 * Hoy solo guarda la URL del video de bienvenida del onboarding (subido
 * desde el CRM en /settings/welcome-video). Se lee directo via Firestore
 * client porque las rules permiten read publico de t2t_config/{docId}
 * (ver firebase/firestore.rules).
 *
 * Cache en memoria por sesion: el welcome video se ve una vez al inicio,
 * no hace falta invalidacion fina ni persistencia entre arranques.
 */
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export type AppConfig = {
  welcomeVideoUrl: string | null;
};

const CONFIG_COL = 't2t_config';
const CONFIG_DOC = 'app';

let cached: AppConfig | null = null;
let inflight: Promise<AppConfig> | null = null;

export async function getAppConfig(force = false): Promise<AppConfig> {
  if (cached && !force) return cached;
  if (inflight && !force) return inflight;

  inflight = (async () => {
    try {
      const snap = await getDoc(doc(db, CONFIG_COL, CONFIG_DOC));
      const data = (snap.data() as { welcomeVideoUrl?: unknown } | undefined) || {};
      const url = typeof data.welcomeVideoUrl === 'string' && data.welcomeVideoUrl.startsWith('http')
        ? data.welcomeVideoUrl
        : null;
      cached = { welcomeVideoUrl: url };
      return cached;
    } catch {
      cached = { welcomeVideoUrl: null };
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Para tests / forzar nuevo fetch (no usado en runtime). */
export function clearAppConfigCache(): void {
  cached = null;
  inflight = null;
}
