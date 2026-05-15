import {
  OAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from './firebase';

/** Proveedor Apple configurado en Firebase Console (sin expo-apple-authentication). */
export function createAppleOAuthProvider(): OAuthProvider {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return provider;
}

/**
 * Inicio de sesión con Apple vía Firebase Auth.
 * - Web: popup OAuth.
 * - Nativo: redirect OAuth (URL de retorno en Firebase Console).
 */
export async function signInWithAppleFirebase(): Promise<UserCredential> {
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
