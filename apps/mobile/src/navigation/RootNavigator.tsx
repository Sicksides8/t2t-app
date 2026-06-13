import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PushNotificationManager from '../components/PushNotificationManager';
import {
  CourseDetailScreen,
  HooksFlow,
  OnboardingFlow,
  SkillCatalogScreen,
  SplashScreen,
  VideoPlayerScreen,
} from '../screens/academy/AcademyScreen';
import { flushPendingDiagnosticIfAuthenticated } from '../services/diagnosticService';
import { getUserProfile, onAuthChange } from '../services/authService';
import { recordActivity } from '../services/streakService';
import { scheduleStreakReminder } from '../services/streakReminder';
import { useAcademyStore, useAuthStore, useNotificationStore } from '../stores';
import { Colors, Spacing, Typography } from '../theme';
import type { RootStackParamList } from '../types';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const hasSeenOnboarding = useAuthStore((state) => state.hasSeenOnboarding);
  const setUser = useAuthStore((state) => state.setUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setHasSeenOnboarding = useAuthStore((state) => state.setHasSeenOnboarding);

  useEffect(() => {
    if (!user?.id) return undefined;
    flushPendingDiagnosticIfAuthenticated().catch(() => undefined);
    // Engagement diario: abrir la app autenticado cuenta como actividad
    // (alimenta la racha y reprograma el recordatorio local).
    void (async () => {
      try {
        await recordActivity();
        await scheduleStreakReminder();
      } catch {
        /* offline: silencioso */
      }
    })();
    const unsub = useNotificationStore.getState().subscribe(user.id);
    return () => unsub?.();
  }, [user?.id]);

  useEffect(() => {
    let unsub: undefined | (() => void);

    async function init() {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      if (seen) {
        await setHasSeenOnboarding(JSON.parse(seen));
      }

      unsub = onAuthChange(async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          useAcademyStore.getState().clearProgress();
          setInitialized();
          return;
        }

        try {
          setUser(await getUserProfile(firebaseUser.uid));
        } catch {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Alumno T2T',
            avatar: firebaseUser.photoURL || undefined,
            role: 'student',
            onboardingCompleted: false,
            diagnosticCompleted: false,
            hookSelections: undefined,
            notificationTokens: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        // Hidratar progreso desde Firestore antes de marcar inicializado
        // para que pantallas como Mis cursos arranquen con datos correctos.
        await useAcademyStore.getState().loadUserProgress(firebaseUser.uid);
        setInitialized();
      });
    }

    init().catch(() => setInitialized());
    return () => {
      unsub?.();
    };
  }, [setHasSeenOnboarding, setInitialized, setUser]);

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <Text style={styles.logo}>T2T Academy</Text>
        <ActivityIndicator color={Colors.accentPrimary} size="large" style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  return (
    <>
      <PushNotificationManager />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          <>
            <Stack.Screen name="Bootstrap" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingFlow} />
          </>
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : !user?.onboardingCompleted ? (
          <Stack.Screen name="Hooks" component={HooksFlow} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
            <Stack.Screen name="SkillCatalog" component={SkillCatalogScreen} />
            <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  logo: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
});
