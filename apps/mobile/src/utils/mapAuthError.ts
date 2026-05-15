import { isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message ?? '');
  }
  return '';
}

export function mapAuthError(error: unknown): string {
  const msg = errorMessage(error);
  if (msg.includes('DEVELOPER_ERROR')) {
    return messages['10'];
  }

  if (isErrorWithCode(error)) {
    const fromCode = messages[error.code];
    if (fromCode) return fromCode;
  }

  if (typeof error === 'object' && error !== null) {
    const e = error as { code?: string };
    if (e.code) {
      const fromCode = messages[e.code];
      if (fromCode) return fromCode;
    }
  }

  return messages.default;
}

const messages: Record<string, string> = {
  default: 'Ocurrio un error. Intenta de nuevo',
  'auth/email-already-in-use': 'Este email ya esta registrado',
  'auth/invalid-email': 'Email invalido',
  'auth/user-not-found': 'No encontramos una cuenta con este email',
  'auth/wrong-password': 'Contrasena incorrecta',
  'auth/weak-password': 'La contrasena debe tener al menos 6 caracteres',
  'auth/network-request-failed': 'Error de conexion. Verifica tu internet',
  'auth/invalid-credential': 'Credenciales de Google invalidas. Revisa el Client ID Web en .env',
  'auth/operation-not-allowed': 'Inicio con Google no esta habilitado en Firebase',
  'permission-denied': 'No se pudo guardar tu perfil. Revisa las reglas de Firestore',
  'google-error': 'Error al iniciar sesion con Google',
  'google-no-id-token':
    'Google no devolvio un token valido. En .env usa el Client ID Web (client_type 3 en google-services.json)',
  '10':
    'Google Sign-In: anade el SHA-1 de debug en Firebase (app com.t2tacademy.app) y vuelve a descargar google-services.json. Ejecuta: npm run android:sha1',
  DEVELOPER_ERROR:
    'Google Sign-In: anade el SHA-1 de debug en Firebase (app com.t2tacademy.app) y vuelve a descargar google-services.json. Ejecuta: npm run android:sha1',
  [statusCodes.PLAY_SERVICES_NOT_AVAILABLE]:
    'Google Play Services no esta disponible. Actualizalo en el dispositivo',
  [statusCodes.IN_PROGRESS]: 'Google Sign-In ya esta en curso, espera un momento',
};
