import { FileSystemUploadType, getInfoAsync, uploadAsync } from 'expo-file-system/legacy';
import { apiFetch, hasApiBaseUrl } from './api';

type PresignData = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

type PresignApiResponse = {
  success?: boolean;
  data?: PresignData;
  uploadUrl?: string;
  publicUrl?: string;
  key?: string;
  error?: { message?: string };
};

export type AvatarUploadOptions = {
  /** Bytes conocidos (ej. ImagePicker asset.fileSize). */
  size?: number;
  contentType?: string;
  filename?: string;
};

function guessContentType(uri: string, explicit?: string): string {
  if (explicit && explicit.startsWith('image/')) return explicit;
  const lower = uri.toLowerCase();
  if (lower.includes('.png') || lower.endsWith('png')) return 'image/png';
  if (lower.includes('.webp') || lower.endsWith('webp')) return 'image/webp';
  return 'image/jpeg';
}

function unwrapPresign(json: PresignApiResponse): PresignData {
  if (json.data?.uploadUrl && json.data.publicUrl) {
    return json.data;
  }
  if (json.uploadUrl && json.publicUrl && json.key) {
    return { uploadUrl: json.uploadUrl, publicUrl: json.publicUrl, key: json.key };
  }
  throw new Error(json.error?.message || 'No se pudo firmar la subida del avatar');
}

async function resolveFileSize(localUri: string, hinted?: number): Promise<number> {
  if (typeof hinted === 'number' && hinted > 0) return hinted;
  const info = await getInfoAsync(localUri);
  if (info.exists && !info.isDirectory && typeof info.size === 'number' && info.size > 0) {
    return info.size;
  }
  // content:// a veces no reporta size; techo seguro para pasar validación server.
  return 512 * 1024;
}

/**
 * Sube avatar a Cloudflare R2 vía presign del CRM (`/api/uploads/avatar-presign`).
 * Evita Firebase Storage (bloqueado en plan Spark).
 */
export async function uploadUserAvatar(
  localUri: string,
  userId: string,
  options: AvatarUploadOptions = {},
): Promise<string> {
  if (!hasApiBaseUrl()) {
    throw new Error(
      'Falta EXPO_PUBLIC_API_BASE_URL. El avatar se sube a R2 a través del CRM/API.',
    );
  }

  const contentType = guessContentType(localUri, options.contentType);
  const size = await resolveFileSize(localUri, options.size);
  const filename = options.filename || `avatar-${userId}.jpg`;

  const json = await apiFetch<PresignApiResponse>('/api/uploads/avatar-presign', {
    method: 'POST',
    body: JSON.stringify({ contentType, size, filename }),
  });
  const presigned = unwrapPresign(json);

  const result = await uploadAsync(presigned.uploadUrl, localUri, {
    httpMethod: 'PUT',
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    if (__DEV__) {
      console.warn('[storageService] R2 avatar upload HTTP', result.status, result.body?.slice?.(0, 300));
    }
    throw new Error('No se pudo subir la foto a R2');
  }

  return presigned.publicUrl;
}
