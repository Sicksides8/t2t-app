import { Platform } from 'react-native';
import { setVideoCacheSizeAsync, type BufferOptions, type VideoSource } from 'expo-video';
import { getLessonVideoUrl } from '../constants/media';

/** Tamaño LRU del caché de video (2 GB). Persistente entre sesiones. */
const VIDEO_CACHE_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

let cacheConfigured: Promise<boolean> | null = null;

/**
 * Debe ejecutarse antes de crear cualquier VideoPlayer.
 * Devuelve true solo si el tamaño de caché quedó configurado.
 */
export function ensureVideoCacheConfigured(): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(false);
  if (!cacheConfigured) {
    cacheConfigured = setVideoCacheSizeAsync(VIDEO_CACHE_SIZE_BYTES)
      .then(() => true)
      .catch((error) => {
        if (__DEV__) {
          console.warn(
            '[video] No se pudo configurar el caché (¿ya hay un reproductor activo?):',
            error,
          );
        }
        return false;
      });
  }
  return cacheConfigured;
}

/** Buffer generoso para lecciones largas y seeks dentro del tramo ya descargado. */
export const LESSON_VIDEO_BUFFER_OPTIONS: BufferOptions = {
  preferredForwardBufferDuration: 60,
  minBufferForPlayback: 4,
  prioritizeTimeOverSizeThreshold: true,
  waitsToMinimizeStalling: true,
  // No usar maxBufferBytes: null — Android (expo-video 3.0) no acepta null en el puente nativo.
};

type BufferCapablePlayer = {
  bufferOptions?: BufferOptions;
};

type ReplaceablePlayer = BufferCapablePlayer & {
  replaceAsync: (source: VideoSource) => Promise<void>;
};

export function applyLessonPlayerStreaming(player: BufferCapablePlayer): void {
  player.bufferOptions = LESSON_VIDEO_BUFFER_OPTIONS;
}

export function buildLessonVideoSource(rawUrl?: string, useCaching = false): VideoSource | null {
  const uri = getLessonVideoUrl(rawUrl);
  if (!uri) return null;

  if (!useCaching) {
    return uri;
  }

  return {
    uri,
    contentType: 'auto',
    useCaching: Platform.OS !== 'web',
  };
}

export function getLessonVideoSourceUri(rawUrl?: string): string {
  return getLessonVideoUrl(rawUrl);
}

export type LessonVideoLoadMode = 'cached' | 'direct' | 'failed';

/**
 * Carga el video con fallback: primero streaming directo (más compatible con R2),
 * luego caché en disco si está disponible.
 */
export async function loadLessonIntoPlayer(
  player: ReplaceablePlayer,
  rawUrl?: string,
): Promise<LessonVideoLoadMode> {
  const uri = getLessonVideoUrl(rawUrl);
  if (!uri) return 'failed';

  applyLessonPlayerStreaming(player);

  try {
    await player.replaceAsync(uri);
    return 'direct';
  } catch (directError) {
    if (__DEV__) {
      console.warn('[video] Carga directa falló, probando con caché:', directError);
    }
  }

  const cacheReady = await ensureVideoCacheConfigured();
  if (!cacheReady) return 'failed';

  const cachedSource = buildLessonVideoSource(rawUrl, true);
  if (!cachedSource || typeof cachedSource === 'string') return 'failed';

  try {
    await player.replaceAsync(cachedSource);
    return 'cached';
  } catch (cachedError) {
    if (__DEV__) {
      console.warn('[video] Carga con caché falló:', cachedError);
    }
    return 'failed';
  }
}
