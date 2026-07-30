/**
 * App-wide remote config (t2t_config/app).
 *
 * Hoy guarda la URL del video de bienvenida del onboarding (subido
 * desde el CRM en /welcome-video) y sus subtítulos opcionales. Se lee
 * directo via Firestore client porque las rules permiten read publico de
 * t2t_config/{docId} (ver firebase/firestore.rules).
 *
 * Cache en memoria por sesion: el welcome video se ve una vez al inicio,
 * no hace falta invalidacion fina ni persistencia entre arranques.
 */
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { SubtitleTrack } from '../types';

export type AppConfig = {
  welcomeVideoUrl: string | null;
  welcomeVideoSubtitles: SubtitleTrack[];
  /** Video del slide 04 «El mundo laboral cambió»; fallback a welcomeVideoUrl. */
  onboardingImpactVideoUrl: string | null;
};

const CONFIG_COL = 't2t_config';
const CONFIG_DOC = 'app';

let cached: AppConfig | null = null;
let inflight: Promise<AppConfig> | null = null;

function parseSubtitleTracks(input: unknown): SubtitleTrack[] {
  if (!Array.isArray(input)) return [];
  const tracks: SubtitleTrack[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const lang = String((raw as { lang?: unknown }).lang || '')
      .trim()
      .toLowerCase();
    const url = String((raw as { url?: unknown }).url || '').trim();
    if (!lang || !url.startsWith('http') || seen.has(lang)) continue;
    const labelRaw = (raw as { label?: unknown }).label;
    const label =
      (typeof labelRaw === 'string' ? labelRaw.trim() : '') || lang;
    tracks.push({ lang, label, url });
    seen.add(lang);
  }
  return tracks;
}

export async function getAppConfig(force = false): Promise<AppConfig> {
  if (cached && !force) return cached;
  if (inflight && !force) return inflight;

  inflight = (async () => {
    try {
      const snap = await getDoc(doc(db, CONFIG_COL, CONFIG_DOC));
      const data = (snap.data() as {
        welcomeVideoUrl?: unknown;
        welcomeVideoSubtitles?: unknown;
        onboardingImpactVideoUrl?: unknown;
      } | undefined) || {};
      const url =
        typeof data.welcomeVideoUrl === 'string' && data.welcomeVideoUrl.startsWith('http')
          ? data.welcomeVideoUrl
          : null;
      const impactUrl =
        typeof data.onboardingImpactVideoUrl === 'string' &&
        data.onboardingImpactVideoUrl.startsWith('http')
          ? data.onboardingImpactVideoUrl
          : null;
      cached = {
        welcomeVideoUrl: url,
        welcomeVideoSubtitles: parseSubtitleTracks(data.welcomeVideoSubtitles),
        onboardingImpactVideoUrl: impactUrl ?? url,
      };
      return cached;
    } catch {
      cached = {
        welcomeVideoUrl: null,
        welcomeVideoSubtitles: [],
        onboardingImpactVideoUrl: null,
      };
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
