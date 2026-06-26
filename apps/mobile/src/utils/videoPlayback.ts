/** Fracción mínima del timeline (~100 %). */
export const VIDEO_COMPLETE_RATIO = 0.998;

/** Tolerancia en segundos solo para el último tramo (ticks de timeUpdate / redondeo). */
export const VIDEO_END_EPSILON_SEC = 0.2;

/** Ventana tras cambiar velocidad donde ignoramos completado por progreso (evita races). */
export const PLAYBACK_RATE_SETTLE_MS = 400;

export function clampTimelineTime(currentTime: number, duration: number): number {
  if (!Number.isFinite(currentTime)) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(0, currentTime);
  return Math.max(0, Math.min(currentTime, duration));
}

export function normalizePlaybackProgress(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return clampTimelineTime(currentTime, duration) / duration;
}

/**
 * Determina si el video llegó al final usando timeline del media (segundos),
 * no tiempo real. Funciona igual a 0.75x, 1x o 2x.
 * Requiere estar en el tramo final Y haber consumido ~100 % del contenido.
 */
export function isVideoTimelineComplete(currentTime: number, duration: number): boolean {
  if (!Number.isFinite(duration) || duration <= 0) return false;
  const clamped = clampTimelineTime(currentTime, duration);
  if (clamped < duration - VIDEO_END_EPSILON_SEC) return false;
  return clamped / duration >= VIDEO_COMPLETE_RATIO;
}

/**
 * Intervalo de timeUpdate: más frecuente a mayor velocidad para no saltarse el final en UI.
 */
export function timeUpdateIntervalForRate(rate: number): number {
  const safe = Math.max(0.25, Math.min(rate, 2));
  return Math.min(0.5, Math.max(0.15, 0.3 / safe));
}

type RateCapablePlayer = {
  preservesPitch?: boolean;
  playbackRate?: number;
  timeUpdateEventInterval?: number;
};

export function applyPlaybackRate(player: RateCapablePlayer, rate: number): void {
  player.preservesPitch = true;
  player.playbackRate = rate;
  player.timeUpdateEventInterval = timeUpdateIntervalForRate(rate);
}
