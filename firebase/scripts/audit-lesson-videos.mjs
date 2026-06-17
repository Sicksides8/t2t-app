/**
 * Audita lecciones con video demo/vacío y lista candidatos en R2 para recuperación.
 *
 * Credenciales Admin:
 *   export GOOGLE_APPLICATION_CREDENTIALS=ruta/al/serviceAccount.json
 *
 * R2 (opcional, para listar videos huérfanos por curso):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
 *
 * Uso:
 *   node firebase/scripts/audit-lesson-videos.mjs
 *   node firebase/scripts/audit-lesson-videos.mjs --courseId=ABC123
 *   node firebase/scripts/audit-lesson-videos.mjs --fix
 */

import admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));

const P = 't2t_';
const COL = { lessons: `${P}lessons`, courses: `${P}courses` };
const MOCK_VIDEO_URL = 'https://pub-cbb826460242448e83ebe8b4ed4e375e.r2.dev/t2t-video-mock.mp4';

const args = process.argv.slice(2);
const courseIdFilter = args.find((a) => a.startsWith('--courseId='))?.split('=')[1]?.trim() || null;
const autoFix = args.includes('--fix');

function isMockOrMissing(url) {
  const trimmed = (url || '').trim();
  return !trimmed || trimmed === MOCK_VIDEO_URL || trimmed.includes('t2t-video-mock.mp4');
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n/g, '\n');
    if (!process.env[key]) process.env[key] = value;
  }
  return true;
}

/** Carga .env de web-crm si existen (no pisa variables ya definidas en el shell). */
function loadEnvFiles() {
  const root = join(__dirname, '..', '..');
  const loaded = [];
  for (const rel of ['apps/web-crm/.env.local', 'apps/web-crm/.env', '.env.local', '.env']) {
    const filePath = join(root, rel);
    if (loadEnvFile(filePath)) loaded.push(rel);
  }
  return loaded;
}

function readR2Config() {
  const accountId =
    (process.env.R2_ACCOUNT_ID || '').trim() ||
    (process.env.R2_ENDPOINT || '').match(/^https?:\/\/([a-z0-9]+)\.r2\.cloudflarestorage\.com/i)?.[1] ||
    '';
  return {
    accountId,
    accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim(),
    bucket: (process.env.R2_BUCKET || process.env.R2_BUCKET_NAME || '').trim(),
    publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || '').trim().replace(/\/$/, ''),
  };
}

function isR2Configured(cfg) {
  return Boolean(cfg.accountId && cfg.accessKeyId && cfg.secretAccessKey && cfg.bucket && cfg.publicBaseUrl);
}

function publicUrlForKey(cfg, key) {
  return `${cfg.publicBaseUrl}/${encodeURI(key)}`;
}

async function listR2VideosForCourse(cfg, courseId) {
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  const prefix = `videos/${courseId}/`;
  const keys = [];
  let token;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: cfg.bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const item of res.Contents || []) {
      if (item.Key) keys.push(item.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys.map((key) => ({ key, url: publicUrlForKey(cfg, key) }));
}

function initFirebase() {
  if (admin.apps.length) return;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const json = JSON.parse(readFileSync(credPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(json) });
    return;
  }
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

async function main() {
  const envFiles = loadEnvFiles();
  if (envFiles.length) {
    console.log(`Env: ${envFiles.join(', ')}`);
  }
  initFirebase();
  const db = admin.firestore();
  const r2Cfg = readR2Config();
  const r2Ready = isR2Configured(r2Cfg);

  let query = db.collection(COL.lessons);
  if (courseIdFilter) {
    query = query.where('courseId', '==', courseIdFilter);
  }
  const snap = await query.get();

  const affected = [];
  const byCourse = new Map();

  for (const doc of snap.docs) {
    const data = doc.data();
    const videoUrl = typeof data.videoUrl === 'string' ? data.videoUrl.trim() : '';
    if (!isMockOrMissing(videoUrl)) continue;
    const entry = {
      lessonId: doc.id,
      courseId: data.courseId || '',
      title: data.title || '',
      order: data.order ?? 0,
      videoUrl: videoUrl || '(vacío)',
    };
    affected.push(entry);
    const list = byCourse.get(entry.courseId) || [];
    list.push(entry);
    byCourse.set(entry.courseId, list);
  }

  console.log(`\n=== Auditoría de videos de módulos ===`);
  console.log(`Lecciones con demo/vacío: ${affected.length}`);
  if (courseIdFilter) console.log(`Filtro courseId: ${courseIdFilter}`);
  if (!r2Ready) {
    console.log('R2 no configurado: solo reporte Firestore (sin listar objetos R2).');
    console.log('  Agregá R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET y R2_PUBLIC_BASE_URL');
    console.log('  en apps/web-crm/.env (copiá la plantilla desde .env.local.example).');
  }

  const report = [];

  for (const [courseId, lessons] of byCourse.entries()) {
    lessons.sort((a, b) => a.order - b.order);
    let r2Videos = [];
    if (r2Ready) {
      try {
        r2Videos = await listR2VideosForCourse(r2Cfg, courseId);
      } catch (err) {
        console.warn(`No se pudo listar R2 para ${courseId}:`, err.message || err);
      }
    }

    const usedUrls = new Set(
      snap.docs
        .map((d) => d.data().videoUrl)
        .filter((u) => typeof u === 'string' && u.trim() && !isMockOrMissing(u))
        .map((u) => u.trim()),
    );
    const orphanR2 = r2Videos.filter((v) => !usedUrls.has(v.url));

    console.log(`\n--- Curso ${courseId} (${lessons.length} lección/es afectada/s) ---`);
    if (orphanR2.length) {
      console.log(`  Videos en R2 no referenciados: ${orphanR2.length}`);
      for (const v of orphanR2) console.log(`    - ${v.url}`);
    }

    for (const lesson of lessons) {
      let suggestedUrl = null;
      let autoFixable = false;
      if (orphanR2.length === 1 && lessons.length === 1) {
        suggestedUrl = orphanR2[0].url;
        autoFixable = true;
      } else if (orphanR2.length > 0) {
        suggestedUrl = orphanR2[0].url;
      }

      const row = {
        ...lesson,
        r2Orphans: orphanR2.map((v) => v.url),
        suggestedUrl,
        autoFixable,
      };
      report.push(row);

      console.log(`  [${lesson.order}] ${lesson.lessonId} — ${lesson.title}`);
      console.log(`       videoUrl actual: ${lesson.videoUrl}`);
      if (suggestedUrl) {
        console.log(`       sugerencia: ${suggestedUrl}${autoFixable ? ' (auto-fix posible)' : ''}`);
      }

      if (autoFix && autoFixable && suggestedUrl) {
        await db.collection(COL.lessons).doc(lesson.lessonId).set(
          { videoUrl: suggestedUrl, updatedAt: new Date() },
          { merge: true },
        );
        console.log(`       ✓ restaurado en Firestore`);
      }
    }
  }

  if (affected.length === 0) {
    console.log('\nNo hay lecciones con video demo o vacío.');
  } else if (!autoFix) {
    console.log('\nPara aplicar corrección automática cuando hay 1 lección afectada y 1 video huérfano en R2:');
    console.log('  node firebase/scripts/audit-lesson-videos.mjs --fix');
  }

  console.log('\n--- JSON ---');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
