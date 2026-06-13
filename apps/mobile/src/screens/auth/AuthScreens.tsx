import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { isAppleSignInAvailable } from '../../services/appleSignIn';
import {
  AuthDivider,
  AuthField,
  AuthFormShell,
  AuthMailShell,
  AuthSocialButtons,
  OtpInput,
} from '../../components/auth';
import { Colors, Spacing, Typography } from '../../theme';
import { useAuthStore } from '../../stores';
import * as authService from '../../services/authService';
import type { AuthStackParamList } from '../../types';

const RESEND_COOLDOWN_SEC = 60;

/** Penpot: 36_SignUp */
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
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  return (
    <AuthFormShell
      title="Crea tu cuenta"
      subtitle="Vamos a personalizar tu plan."
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      primaryLabel="Crear cuenta"
      primaryLoading={isLoading}
      onPrimary={async () => {
        try {
          await register(email, password, name || 'Alumno T2T');
          navigation.navigate('VerifyEmail');
        } catch {
          /* store sets error */
        }
      }}
      footerLink={{
        label: 'Ya tengo cuenta · Iniciar sesión',
        onPress: () => navigation.navigate('Login'),
      }}
    >
      <AuthSocialButtons
        onGoogle={() => void signInWithGoogleNative().catch(() => {})}
        onApple={appleAvailable ? () => void signInWithAppleNative().catch(() => {}) : undefined}
        disabled={isLoading}
        loading={isLoading}
      />
      <AuthDivider label="o regístrate con email" />
      <AuthField
        label="Nombre completo"
        value={name}
        onChangeText={setName}
        placeholder="Tu nombre"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <AuthField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        placeholder="Mínimo 6 caracteres"
        secure
        autoCapitalize="none"
        autoComplete="password-new"
        textContentType="newPassword"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </AuthFormShell>
  );
}

/** Penpot: 37_Login */
export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const login = useAuthStore((state) => state.login);
  const signInWithGoogleNative = useAuthStore((state) => state.signInWithGoogleNative);
  const signInWithAppleNative = useAuthStore((state) => state.signInWithAppleNative);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  return (
    <AuthFormShell
      title="Bienvenido de vuelta"
      subtitle="Te esperamos en el gimnasio mental."
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      primaryLabel="Iniciar sesión"
      primaryLoading={isLoading}
      onPrimary={() => void login(email, password).catch(() => {})}
      footerLink={{
        label: 'Crear cuenta nueva',
        onPress: () => navigation.navigate('SignUp'),
      }}
    >
      <AuthSocialButtons
        onGoogle={() => void signInWithGoogleNative().catch(() => {})}
        onApple={appleAvailable ? () => void signInWithAppleNative().catch(() => {}) : undefined}
        disabled={isLoading}
        loading={isLoading}
      />
      <AuthDivider label="o con email" />
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <View style={styles.passwordBlock}>
        <AuthField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Tu contraseña"
          secure
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
        />
        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          hitSlop={8}
          style={styles.forgotWrap}
        >
          <Text style={styles.forgotLink}>Olvidé mi contraseña</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </AuthFormShell>
  );
}

/** Penpot: 38_Recuperar_Password */
export function ForgotPasswordScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  return (
    <AuthMailShell
      title="Recupera tu contraseña"
      subtitle="Te enviamos un link para restablecerla."
      variant="purple"
      icon="mail"
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      primaryLabel={sending ? 'Enviando…' : 'Enviar instrucciones'}
      primaryLoading={sending}
      primaryDisabled={email.trim().length === 0}
      onPrimary={async () => {
        try {
          setSending(true);
          await authService.resetPassword(email.trim());
          navigation.navigate('Login');
        } finally {
          setSending(false);
        }
      }}
    >
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
    </AuthMailShell>
  );
}

/** Penpot: 39_Verificar_Email */
export function VerifyEmailScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>) {
  const userEmail = useAuthStore((state) => state.user?.email ?? '');
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

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
      setMessage('Abrí el enlace del email y volvé a intentar.');
    } catch {
      setMessage('No pudimos verificar. Revisá tu conexión.');
    } finally {
      setChecking(false);
    }
  };

  const cooldownLabel =
    cooldown > 0
      ? `Reenviar código · ${String(Math.floor(cooldown / 60)).padStart(2, '0')}:${String(
          cooldown % 60,
        ).padStart(2, '0')}`
      : 'Reenviar código';

  return (
    <AuthMailShell
      title="Verifica tu email"
      subtitle={userEmail ? `Te enviamos un código a ${userEmail}` : 'Te enviamos un código a tu bandeja'}
      variant="teal"
      icon="mail-open"
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      primaryLabel="Verificar"
      primaryLoading={checking}
      primaryDisabled={code.length < 6}
      onPrimary={() => void verify()}
    >
      <OtpInput value={code} onChange={setCode} />
      <Pressable
        onPress={async () => {
          if (cooldown > 0) return;
          await authService.resendEmailVerification();
          setCooldown(RESEND_COOLDOWN_SEC);
        }}
        hitSlop={8}
        disabled={cooldown > 0}
        style={styles.resendWrap}
      >
        <Text style={[styles.resendText, cooldown === 0 && styles.resendActive]}>
          {cooldownLabel}
        </Text>
      </Pressable>
      {message ? <Text style={styles.error}>{message}</Text> : null}
    </AuthMailShell>
  );
}

const styles = StyleSheet.create({
  error: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  passwordBlock: {
    gap: Spacing.sm,
  },
  forgotWrap: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  forgotLink: {
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentPrimary,
  },
  resendWrap: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  resendText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 13,
  },
  resendActive: {
    color: Colors.accentPrimary,
    fontWeight: '600',
  },
});
