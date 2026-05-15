import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Colors } from '../theme';

/** Barra de navegación y gestos del sistema en Android alineados al tema oscuro. */
export default function AndroidSystemChrome() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    void NavigationBar.setBackgroundColorAsync(Colors.bgPrimary);
    void NavigationBar.setButtonStyleAsync('light');
  }, []);

  return null;
}
