import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  OAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from './firebase';
import { loginWithApple } from './authService';
import type { User } from '../types';

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

async function sha256Nonce(rawNonce: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
}

async function requestAppleSignInNative(): Promise<User | null> {
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    const err = new Error('Sign in with Apple no esta disponible en este dispositivo.');
    Object.assign(err, { code: 'apple-not-available' });
    throw err;
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await sha256Nonce(rawNonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      const err = new Error('Apple no devolvio un token de identidad.');
      Object.assign(err, { code: 'apple-no-identity-token' });
      throw err;
    }

    return loginWithApple(credential.identityToken, rawNonce);
  } catch (error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';
    if (code === 'ERR_REQUEST_CANCELED') {
      return null;
    }
    throw error;
  }
}

/** Proveedor Apple para Firebase Auth en web (popup / redirect). */
export function createAppleOAuthProvider(): OAuthProvider {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return provider;
}

async function signInWithAppleFirebaseWeb(): Promise<UserCredential> {
  const redirectResult = await getRedirectResult(auth);
  if (redirectResult) {
    return redirectResult;
  }

  const provider = createAppleOAuthProvider();

  if (Platform.OS === 'web') {
    return signInWithPopup(auth, provider);
  }

  await signInWithRedirect(auth, provider);
  const afterRedirect = await getRedirectResult(auth);
  if (!afterRedirect) {
    throw new Error('Completá el inicio con Apple en el navegador y volvé a la app.');
  }
  return afterRedirect;
}

/**
 * Sign in with Apple: nativo en iOS, OAuth Firebase en web.
 * Android: no disponible (retorna null).
 */
export async function requestAppleSignIn(): Promise<User | null> {
  if (Platform.OS === 'ios') {
    return requestAppleSignInNative();
  }

  if (Platform.OS === 'web') {
    const credential = await signInWithAppleFirebaseWeb();
    const { getOrCreateUserProfile } = await import('./authService');
    return getOrCreateUserProfile(credential.user);
  }

  return null;
}
