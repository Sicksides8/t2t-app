import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { ExperienceLevel, PlanHorizonDays } from '../types';

const VIDEO_STORAGE_KEY = 'preferences:videoPlayer:v1';
const HOME_STORAGE_KEY = 'preferences:home:v1';
const ONBOARDING_STORAGE_KEY = 'preferences:onboarding:v1';

const ALLOWED_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
type AllowedRate = (typeof ALLOWED_RATES)[number];

function clampRate(value: number): AllowedRate {
  const found = ALLOWED_RATES.find((r) => Math.abs(r - value) < 0.001);
  return (found ?? 1) as AllowedRate;
}

type StoredVideoPrefs = {
  videoPlaybackRate?: number;
  videoSubtitleLang?: string | null;
};

type StoredHomePrefs = {
  homeWelcomeVideoDismissedByUser?: Record<string, boolean>;
};

type StoredOnboardingPrefs = {
  planHorizonDays?: PlanHorizonDays;
  experienceLevel?: ExperienceLevel;
};

interface PreferencesState {
  hydrated: boolean;
  videoPlaybackRate: number;
  videoSubtitleLang: string | null;
  homeWelcomeVideoDismissedByUser: Record<string, boolean>;
  planHorizonDays: PlanHorizonDays | null;
  experienceLevel: ExperienceLevel | null;
  hydrate: () => Promise<void>;
  setVideoPlaybackRate: (rate: number) => void;
  setVideoSubtitleLang: (lang: string | null) => void;
  dismissHomeWelcomeVideo: (userId: string) => void;
  setPlanHorizonDays: (days: PlanHorizonDays) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  clearOnboardingPrefs: () => void;
}

async function persistVideoPrefs(
  state: Pick<PreferencesState, 'videoPlaybackRate' | 'videoSubtitleLang'>,
) {
  try {
    const payload: StoredVideoPrefs = {
      videoPlaybackRate: state.videoPlaybackRate,
      videoSubtitleLang: state.videoSubtitleLang,
    };
    await AsyncStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // El reproductor sigue funcionando aunque la persistencia falle.
  }
}

async function persistHomePrefs(
  dismissedByUser: Record<string, boolean>,
) {
  try {
    const payload: StoredHomePrefs = {
      homeWelcomeVideoDismissedByUser: dismissedByUser,
    };
    await AsyncStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // La home sigue funcionando aunque la persistencia falle.
  }
}

async function persistOnboardingPrefs(prefs: StoredOnboardingPrefs) {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // El flujo sigue aunque falle la persistencia local.
  }
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  hydrated: false,
  videoPlaybackRate: 1,
  videoSubtitleLang: null,
  homeWelcomeVideoDismissedByUser: {},
  planHorizonDays: null,
  experienceLevel: null,

  hydrate: async () => {
    if (get().hydrated) return;
    let videoPlaybackRate = 1;
    let videoSubtitleLang: string | null = null;
    let homeWelcomeVideoDismissedByUser: Record<string, boolean> = {};
    let planHorizonDays: PlanHorizonDays | null = null;
    let experienceLevel: ExperienceLevel | null = null;

    try {
      const videoRaw = await AsyncStorage.getItem(VIDEO_STORAGE_KEY);
      if (videoRaw) {
        const parsed = JSON.parse(videoRaw) as StoredVideoPrefs;
        if (typeof parsed.videoPlaybackRate === 'number') {
          videoPlaybackRate = clampRate(parsed.videoPlaybackRate);
        }
        if (typeof parsed.videoSubtitleLang === 'string' && parsed.videoSubtitleLang) {
          videoSubtitleLang = parsed.videoSubtitleLang;
        }
      }
    } catch {
      // Si falla la lectura/parsing, dejamos los defaults de video.
    }

    try {
      const homeRaw = await AsyncStorage.getItem(HOME_STORAGE_KEY);
      if (homeRaw) {
        const parsed = JSON.parse(homeRaw) as StoredHomePrefs;
        if (parsed.homeWelcomeVideoDismissedByUser) {
          homeWelcomeVideoDismissedByUser = parsed.homeWelcomeVideoDismissedByUser;
        }
      }
    } catch {
      // Si falla la lectura/parsing, dejamos el mapa vacío.
    }

    try {
      const onboardingRaw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (onboardingRaw) {
        const parsed = JSON.parse(onboardingRaw) as StoredOnboardingPrefs;
        if (parsed.planHorizonDays === 30 || parsed.planHorizonDays === 60 || parsed.planHorizonDays === 90) {
          planHorizonDays = parsed.planHorizonDays;
        }
        if (
          parsed.experienceLevel === 'beginner' ||
          parsed.experienceLevel === 'intermediate' ||
          parsed.experienceLevel === 'advanced'
        ) {
          experienceLevel = parsed.experienceLevel;
        }
      }
    } catch {
      // Defaults null si falla la lectura.
    }

    set({
      videoPlaybackRate,
      videoSubtitleLang,
      homeWelcomeVideoDismissedByUser,
      planHorizonDays,
      experienceLevel,
      hydrated: true,
    });
  },

  setVideoPlaybackRate: (rate) => {
    const safe = clampRate(rate);
    set({ videoPlaybackRate: safe });
    void persistVideoPrefs({ ...get(), videoPlaybackRate: safe });
  },

  setVideoSubtitleLang: (lang) => {
    const safe = typeof lang === 'string' && lang.length > 0 ? lang : null;
    set({ videoSubtitleLang: safe });
    void persistVideoPrefs({ ...get(), videoSubtitleLang: safe });
  },

  dismissHomeWelcomeVideo: (userId) => {
    const next = { ...get().homeWelcomeVideoDismissedByUser, [userId]: true };
    set({ homeWelcomeVideoDismissedByUser: next });
    void persistHomePrefs(next);
  },

  setPlanHorizonDays: (days) => {
    set({ planHorizonDays: days });
    void persistOnboardingPrefs({
      planHorizonDays: days,
      experienceLevel: get().experienceLevel ?? undefined,
    });
  },

  setExperienceLevel: (level) => {
    set({ experienceLevel: level });
    void persistOnboardingPrefs({
      planHorizonDays: get().planHorizonDays ?? undefined,
      experienceLevel: level,
    });
  },

  clearOnboardingPrefs: () => {
    set({ planHorizonDays: null, experienceLevel: null });
    void AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
  },
}));

export const VIDEO_PLAYBACK_RATES = ALLOWED_RATES;
