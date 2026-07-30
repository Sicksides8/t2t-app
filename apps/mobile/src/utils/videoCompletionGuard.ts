import { isVideoTimelineComplete } from './videoPlayback';

/**
 * Evita marcar completo cuando el reproductor reporta duración parcial
 * (p. ej. ~20 s en un MP4 largo) — causa típica de corte y reinicio.
 */
export function canTrustPlaybackComplete(
  currentTime: number,
  playerDuration: number,
  expectedDurationSec?: number,
): boolean {
  if (!isVideoTimelineComplete(currentTime, playerDuration)) return false;
  if (!expectedDurationSec || expectedDurationSec <= 0) return true;
  if (playerDuration < expectedDurationSec * 0.6) return false;
  return true;
}

export function isPartialStreamDuration(
  playerDuration: number,
  expectedDurationSec?: number,
): boolean {
  if (!expectedDurationSec || expectedDurationSec <= 0) return false;
  return playerDuration > 0 && playerDuration < expectedDurationSec * 0.6;
}
