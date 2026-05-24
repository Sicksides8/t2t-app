import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

/** Cliente OAuth Web (client_type 3 en google-services.json) del proyecto questly-flutter. */
export const GOOGLE_WEB_CLIENT_ID_HINT =
  '34025167590-8oqedbuneoseqo18i0jcegffl2dk03fg.apps.googleusercontent.com';

const ANDROID_OAUTH_SUFFIX = 'pm3ace2f8fnq0iirdqimukeb3kq80u1k';

let configured = false;

function looksLikeAndroidOAuthClient(id: string): boolean {
  return id.includes(ANDROID_OAUTH_SUFFIX);
}

/** Client ID Web para Firebase; en dev corrige si .env tiene el cliente Android por error. */
export function getGoogleWebClientId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!fromEnv) return undefined;
  if (looksLikeAndroidOAuthClient(fromEnv)) {
    if (__DEV__) {
      console.warn(
        '[GoogleSignIn] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID es el cliente Android; usando el Web: ' +
          GOOGLE_WEB_CLIENT_ID_HINT,
      );
      return GOOGLE_WEB_CLIENT_ID_HINT;
    }
  }
  return fromEnv;
}

export function configureGoogleSignIn(): void {
  const clientId = getGoogleWebClientId();
  if (configured || !clientId) return;
  GoogleSignin.configure({
    webClientId: clientId,
    offlineAccess: false,
  });
  configured = true;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim());
}

/** Devuelve null si el usuario canceló el selector de cuenta de Google. */
export async function requestGoogleIdToken(): Promise<string | null> {
  configureGoogleSignIn();
  if (!getGoogleWebClientId()) return null;

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return null;
    }

    let idToken = response.data.idToken;
    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }

    if (!idToken) {
      const err = new Error(
        'Google no devolvio un token valido. Revisa EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (cliente Web, no Android).',
      );
      Object.assign(err, { code: 'google-no-id-token' });
      throw err;
    }

    return idToken;
  } catch (error: unknown) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw error;
  }
}
