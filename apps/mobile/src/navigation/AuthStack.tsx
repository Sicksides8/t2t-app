import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForgotPasswordScreen, LoginScreen, SignUpScreen, VerifyEmailScreen } from '../screens/auth/AuthScreens';
import { useAuthStore } from '../stores';
import type { AuthStackParamList } from '../types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  const pendingAuthRoute = useAuthStore((state) => state.pendingAuthRoute);
  const setPendingAuthRoute = useAuthStore((state) => state.setPendingAuthRoute);

  // Capturamos la ruta pendiente solo en el primer mount; así no remontamos
  // el navegador si el usuario navega manualmente después.
  const initialRouteRef = useRef<keyof AuthStackParamList>(pendingAuthRoute ?? 'SignUp');

  useEffect(() => {
    if (pendingAuthRoute) {
      setPendingAuthRoute(null);
    }
  }, [pendingAuthRoute, setPendingAuthRoute]);

  return (
    <Stack.Navigator
      initialRouteName={initialRouteRef.current}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  );
}
