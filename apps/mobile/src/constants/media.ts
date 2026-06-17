/** Mock de desarrollo — video único para bienvenida y módulos hasta tener assets reales. */
export const MOCK_VIDEO_URL =
  'https://pub-cbb826460242448e83ebe8b4ed4e375e.r2.dev/t2t-video-mock.mp4';

/** @deprecated Usar MOCK_VIDEO_URL */
export const MOCK_WELCOME_VIDEO_URL = MOCK_VIDEO_URL;

export function isMockVideoUrl(url?: string | null): boolean {
  const trimmed = (url || '').trim();
  return !trimmed || trimmed === MOCK_VIDEO_URL || trimmed.includes('t2t-video-mock.mp4');
}

export function getWelcomeVideoUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WELCOME_VIDEO_URL?.trim();
  return fromEnv && fromEnv.startsWith('http') ? fromEnv : MOCK_VIDEO_URL;
}

export function getLessonVideoUrl(url?: string): string {
  const trimmed = (url || '').trim();
  if (isMockVideoUrl(trimmed)) return '';
  if (trimmed && trimmed.startsWith('http') && !trimmed.includes('example.com')) {
    return trimmed;
  }
  return '';
}
