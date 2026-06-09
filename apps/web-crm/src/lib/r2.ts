import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 es compatible con S3.
 * Endpoint estándar: https://<account_id>.r2.cloudflarestorage.com
 *
 * Variables aceptadas (cualquiera de las dos formas):
 *   R2_ACCOUNT_ID  o  R2_ENDPOINT
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET  o  R2_BUCKET_NAME
 *   R2_PUBLIC_BASE_URL  (ej: https://pub-xxx.r2.dev o dominio custom; sin slash final)
 */

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

let cachedClient: S3Client | null = null;

function extractAccountIdFromEndpoint(endpoint?: string): string {
  if (!endpoint) return '';
  const match = endpoint.match(/^https?:\/\/([a-z0-9]+)\.r2\.cloudflarestorage\.com/i);
  return match ? match[1] : '';
}

function readConfig(): R2Config {
  const accountId =
    (process.env.R2_ACCOUNT_ID || '').trim() ||
    extractAccountIdFromEndpoint(process.env.R2_ENDPOINT);
  const cfg: R2Config = {
    accountId,
    accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim(),
    bucket: (process.env.R2_BUCKET || process.env.R2_BUCKET_NAME || '').trim(),
    publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || '').trim().replace(/\/$/, ''),
  };
  return cfg;
}

export function isR2Configured(): boolean {
  const c = readConfig();
  return Boolean(c.accountId && c.accessKeyId && c.secretAccessKey && c.bucket && c.publicBaseUrl);
}

export function getR2Config(): R2Config {
  const cfg = readConfig();
  if (!isR2Configured()) {
    throw new Error(
      'R2 no está configurado. Definí R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET y R2_PUBLIC_BASE_URL en .env',
    );
  }
  return cfg;
}

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const cfg = getR2Config();
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return cachedClient;
}

/** Construye la URL pública (lectura) de un objeto en el bucket. */
export function publicUrlForKey(key: string): string {
  const cfg = getR2Config();
  return `${cfg.publicBaseUrl}/${encodeURI(key)}`;
}

/**
 * Devuelve una URL firmada para PUT directo desde el browser.
 * El cliente debe usar el mismo Content-Type al hacer el PUT.
 */
export async function presignPutUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const cfg = getR2Config();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: params.key,
    ContentType: params.contentType,
  });
  const uploadUrl = await getSignedUrl(getClient(), command, {
    expiresIn: params.expiresInSeconds ?? 60 * 10,
  });
  return {
    uploadUrl,
    publicUrl: publicUrlForKey(params.key),
    key: params.key,
  };
}

/** Borra un objeto del bucket. Best-effort: no lanza si no existe. */
export async function deleteObject(key: string): Promise<void> {
  const cfg = getR2Config();
  try {
    await getClient().send(
      new DeleteObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
      }),
    );
  } catch (err) {
    if ((err as { name?: string })?.name === 'NoSuchKey') return;
    throw err;
  }
}

/** Si la URL pública pertenece al bucket configurado, extrae la key. */
export function keyFromPublicUrl(url: string): string | null {
  if (!url) return null;
  try {
    const cfg = readConfig();
    if (!cfg.publicBaseUrl) return null;
    const base = cfg.publicBaseUrl.replace(/\/$/, '');
    if (!url.startsWith(`${base}/`)) return null;
    return decodeURI(url.slice(base.length + 1));
  } catch {
    return null;
  }
}

const SAFE_CHARS = /[^a-zA-Z0-9._-]+/g;

/** Normaliza un nombre de archivo para usarlo como key sin colisiones obvias. */
export function sanitizeFilename(filename: string): string {
  const base = filename.split('/').pop() || filename;
  return base.replace(SAFE_CHARS, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file';
}
