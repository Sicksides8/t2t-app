import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForgotPasswordScreen, LoginScreen, SignUpScreen, VerifyEmailScreen } from '../screens/auth/AuthScreens';
import type { AuthStackParamList } from '../types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  );
}
