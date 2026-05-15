import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthDivider, AuthPenpotShell, AuthSocialButtons, OtpInput } from '../../components/auth';
import { Button, Input } from '../../components/ui';
import { PENPOT_FRAMES } from '../../data/penpotFrames';
import { Colors, Typography } from '../../theme';
import { useAuthStore } from '../../stores';
import * as authService from '../../services/authService';
import type { AuthStackParamList } from '../../types';

const RESEND_COOLDOWN_SEC = 60;

/** Penpot: 32_SignUp */
export function SignUpScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'SignUp'>) {
  const register = useAuthStore((state) => state.register);
  const signInWithGoogleNative = useAuthStore((state) => state.signInWithGoogleNative);
  const signInWithAppleNative = useAuthStore((state) => state.signInWithAppleNative);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    clearError();
  }, [clearError]);

  const frame = PENPOT_FRAMES['32_SignUp'];

  return (
    <AuthPenpotShell frame={frame}>
      <Input label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="tu@email.com" />
      <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 6 caracteres" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title="Crear cuenta"
        loading={isLoading}
        onPress={async () => {
          try {
            await register(email, password, name || 'Alumno T2T');
            navigation.navigate('VerifyEmail');
          } catch {
            /* store sets error */
          }
        }}
      />
      <AuthDivider />
      <AuthSocialButtons
        onGoogle={() => void signInWithGoogleNative().catch(() => {})}
        onApple={() => void signInWithAppleNative().catch(() => {})}
        disabled={isLoading}
        loading={isLoading}
      />
      <Button title="Ya tengo cuenta" variant="ghost" onPress={() => navigation.navigate('Login')} />
    </AuthPenpotShell>
  );
}

/** Penpot: 33_Login */
export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const login = useAuthStore((state) => state.login);
  const signInWithGoogleNative = useAuthStore((state) => state.signInWithGoogleNative);
  const signInWithAppleNative = useAuthStore((state) => state.signInWithAppleNative);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    clearError();
  }, [clearError]);

  const frame = PENPOT_FRAMES['33_Login'];

  return (
    <AuthPenpotShell frame={frame}>
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="tu@email.com" />
      <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="Tu contraseña" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Iniciar sesión" loading={isLoading} onPress={() => void login(email, password).catch(() => {})} />
      <AuthDivider />
      <AuthSocialButtons
        onGoogle={() => void signInWithGoogleNative().catch(() => {})}
        onApple={() => void signInWithAppleNative().catch(() => {})}
        disabled={isLoading}
        loading={isLoading}
      />
      <Button title="Recuperar contraseña" variant="ghost" onPress={() => navigation.navigate('ForgotPassword')} />
      <Button title="Crear cuenta" variant="secondary" onPress={() => navigation.navigate('SignUp')} />
    </AuthPenpotShell>
  );
}

/** Penpot: 34_Recuperar_Password */
export function ForgotPasswordScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const frame = PENPOT_FRAMES['34_Recuperar_Password'];

  return (
    <AuthPenpotShell frame={frame}>
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="tu@email.com" />
      <Button
        title={sent ? 'Instrucciones enviadas' : 'Enviar instrucciones'}
        onPress={async () => {
          await authService.resetPassword(email.trim());
          setSent(true);
          navigation.navigate('Login');
        }}
      />
    </AuthPenpotShell>
  );
}

/** Penpot: 35_Verificar_Email */
export function VerifyEmailScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const frame = PENPOT_FRAMES['35_Verificar_Email'];

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const verify = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const verified = await authService.checkEmailVerified();
      if (verified) {
        await refreshUserProfile();
        navigation.navigate('Login');
        return;
      }
      setMessage('Abrí el enlace del email y volvé a intentar. El código confirma que revisaste tu bandeja.');
    } catch {
      setMessage('No pudimos verificar. Revisá tu conexión.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <AuthPenpotShell frame={frame}>
      <Text style={styles.otpHint}>Ingresá 6 dígitos y tocá Verificar después de abrir el email.</Text>
      <OtpInput value={code} onChange={setCode} />
      {message ? <Text style={styles.error}>{message}</Text> : null}
      <Button title="Verificar" loading={checking} disabled={code.length < 6} onPress={() => void verify()} />
      <Button
        title={cooldown > 0 ? `Reenviar (${cooldown}s)` : 'Reenviar código'}
        variant="ghost"
        disabled={cooldown > 0}
        onPress={async () => {
          await authService.resendEmailVerification();
          setCooldown(RESEND_COOLDOWN_SEC);
        }}
      />
    </AuthPenpotShell>
  );
}

const styles = StyleSheet.create({
  error: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  otpHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
