import { useFonts } from 'expo-font';

/**
 * Carga las fuentes custom del bundle.
 * - `DreamingOutloud`: handwritten usado en t\u00edtulos handwritten del test
 *   (Splash, Diagn\u00f3stico, Reflexi\u00f3n, Tiempo, Tu futuro, Mir\u00e1 tus m\u00fasculos).
 * - `Poppins-Regular/Medium/SemiBold/Bold`: tipograf\u00eda principal de la app.
 *
 * Cada variant de Poppins se carga con un nombre \u00fanico (no como una sola
 * `Poppins`) para evitar fake-bold en Android y permitir mapear cada token
 * de `Typography` a su archivo exacto.
 *
 * Devuelve `[loaded, error]` exactamente como `useFonts`.
 */
export function useAppFonts() {
  return useFonts({
    DreamingOutloud: require('../../assets/fonts/DreamingOutloud.otf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
  });
}
