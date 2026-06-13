import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'preferences:videoPlayer:v1';

const ALLOWED_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
type AllowedRate = (typeof ALLOWED_RATES)[number];

function clampRate(value: number): AllowedRate {
  const found = ALLOWED_RATES.find((r) => Math.abs(r - value) < 0.001);
  return (found ?? 1) as AllowedRate;
}

type StoredPrefs = {
  videoPlaybackRate?: number;
  videoSubtitleLang?: string | null;
};

interface PreferencesState {
  hydrated: boolean;
  videoPlaybackRate: number;
  videoSubtitleLang: string | null;
  hydrate: () => Promise<void>;
  setVideoPlaybackRate: (rate: number) => void;
  setVideoSubtitleLang: (lang: string | null) => void;
}

async function persist(state: Pick<PreferencesState, 'videoPlaybackRate' | 'videoSubtitleLang'>) {
  try {
    const payload: StoredPrefs = {
      videoPlaybackRate: state.videoPlaybackRate,
      videoSubtitleLang: state.videoSubtitleLang,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // El reproductor sigue funcionando aunque la persistencia falle.
  }
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  hydrated: false,
  videoPlaybackRate: 1,
  videoSubtitleLang: null,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredPrefs;
        const rate =
          typeof parsed.videoPlaybackRate === 'number'
            ? clampRate(parsed.videoPlaybackRate)
            : 1;
        const lang =
          typeof parsed.videoSubtitleLang === 'string' && parsed.videoSubtitleLang
            ? parsed.videoSubtitleLang
            : null;
        set({ videoPlaybackRate: rate, videoSubtitleLang: lang, hydrated: true });
        return;
      }
    } catch {
      // Si falla la lectura/parsing, dejamos los defaults.
    }
    set({ hydrated: true });
  },

  setVideoPlaybackRate: (rate) => {
    const safe = clampRate(rate);
    set({ videoPlaybackRate: safe });
    void persist({ ...get(), videoPlaybackRate: safe });
  },

  setVideoSubtitleLang: (lang) => {
    const safe = typeof lang === 'string' && lang.length > 0 ? lang : null;
    set({ videoSubtitleLang: safe });
    void persist({ ...get(), videoSubtitleLang: safe });
  },
}));

export const VIDEO_PLAYBACK_RATES = ALLOWED_RATES;
