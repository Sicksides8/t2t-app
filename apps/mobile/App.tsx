import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import AndroidSystemChrome from './src/components/AndroidSystemChrome';
import { GlobalNetworkGate } from './src/components/GlobalNetworkGate';
import RootNavigator from './src/navigation/RootNavigator';
import OfflineBanner from './src/components/OfflineBanner';
import { configureGoogleSignIn } from './src/services/googleSignIn';
import { Colors } from './src/theme';

configureGoogleSignIn();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bgPrimary,
    card: Colors.bgElevated,
    text: Colors.textPrimary,
    border: Colors.divider,
    primary: Colors.accentPrimary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AndroidSystemChrome />
      <AppErrorBoundary>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" backgroundColor={Colors.bgPrimary} translucent />
          <GlobalNetworkGate>
            <OfflineBanner />
            <RootNavigator />
          </GlobalNetworkGate>
        </NavigationContainer>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
