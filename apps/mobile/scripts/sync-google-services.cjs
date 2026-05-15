/**
 * Asegura que google-services.json exista en android/app/ tras prebuild.
 * Expo suele copiarlo solo; este script refuerza la copia desde apps/mobile/google-services.json.
 */
const fs = require('fs');
const path = require('path');

const mobileRoot = path.join(__dirname, '..');
const src = path.join(mobileRoot, 'google-services.json');
const destDir = path.join(mobileRoot, 'android', 'app');
const dest = path.join(destDir, 'google-services.json');

if (!fs.existsSync(src)) {
  console.warn('[sync-google-services] No se encontró google-services.json en apps/mobile.');
  process.exit(0);
}

if (!fs.existsSync(destDir)) {
  console.warn('[sync-google-services] android/app no existe todavía. Ejecuta antes: npx expo prebuild --platform android');
  process.exit(0);
}

fs.copyFileSync(src, dest);
console.log('[sync-google-services] Copiado a', dest);
