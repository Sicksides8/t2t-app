/**
 * Copia credentials/keystore.properties → android/keystore.properties
 * (o lo genera desde credentials/.keystore-secrets.txt).
 */
const fs = require('fs');
const path = require('path');

const mobileRoot = path.join(__dirname, '..');
const credentialsDir = path.join(mobileRoot, 'credentials');
const src = path.join(credentialsDir, 'keystore.properties');
const secrets = path.join(credentialsDir, '.keystore-secrets.txt');
const androidDir = path.join(mobileRoot, 'android');
const dest = path.join(androidDir, 'keystore.properties');

function parseGradleBlockFromSecrets(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim().startsWith('storeFile='));
  if (start === -1) return null;
  const block = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) break;
    if (line.startsWith('storeFile=') || line.startsWith('storePassword=') || line.startsWith('keyAlias=') || line.startsWith('keyPassword=')) {
      block.push(line);
    } else if (block.length) {
      break;
    }
  }
  return block.length ? `${block.join('\n')}\n` : null;
}

function ensureSource() {
  if (fs.existsSync(src)) return fs.readFileSync(src, 'utf8');
  if (!fs.existsSync(secrets)) {
    console.error('[setup-android-signing] Falta credentials/keystore.properties o .keystore-secrets.txt');
    process.exit(1);
  }
  const parsed = parseGradleBlockFromSecrets(fs.readFileSync(secrets, 'utf8'));
  if (!parsed) {
    console.error('[setup-android-signing] No se pudo leer el bloque Gradle en .keystore-secrets.txt');
    process.exit(1);
  }
  fs.mkdirSync(credentialsDir, { recursive: true });
  fs.writeFileSync(src, parsed, 'utf8');
  console.log('[setup-android-signing] Creado', src);
  return parsed;
}

if (!fs.existsSync(androidDir)) {
  console.error('[setup-android-signing] No existe android/. Ejecuta antes: npm run prebuild:android');
  process.exit(1);
}

const content = ensureSource();
fs.writeFileSync(dest, content, 'utf8');
console.log('[setup-android-signing] Copiado a', dest);

const storeFileRel = content.match(/storeFile=(.+)/m)?.[1]?.trim();
const keystorePath = storeFileRel
  ? path.resolve(androidDir, 'app', storeFileRel)
  : path.join(credentialsDir, 't2t-upload.keystore');
if (!fs.existsSync(keystorePath)) {
  console.warn('[setup-android-signing] No se encontró el .keystore en', keystorePath);
} else {
  console.log('[setup-android-signing] Keystore OK:', keystorePath);
}
