import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';
import { Colors } from '../theme';

/** Barra de navegación y gestos del sistema en Android alineados al tema oscuro. */
export default function AndroidSystemChrome() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Con edge-to-edge activo (default en Expo SDK 55+ y obligatorio desde
    // Android 15), `setBackgroundColorAsync` solo emite un warning y no
    // pinta nada: la barra de navegación es transparente y el contenido
    // de la app se ve detrás. Lo llamamos solo si edge-to-edge está off.
    if (!isEdgeToEdge()) {
      void NavigationBar.setBackgroundColorAsync(Colors.bgPrimary);
    }
    void NavigationBar.setButtonStyleAsync('light');
  }, []);

  return null;
}
