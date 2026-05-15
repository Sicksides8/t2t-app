/**
 * Imprime SHA-1/SHA-256 del keystore debug usado por expo run:android.
 * Anade el SHA-1 en Firebase Console → Project settings → Your apps → com.t2tacademy.app
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const keystore = path.join(__dirname, '..', 'android', 'app', 'debug.keystore');
if (!fs.existsSync(keystore)) {
  console.error('No existe', keystore);
  console.error('Ejecuta antes: npx expo prebuild --platform android');
  process.exit(1);
}

const out = execSync(
  `keytool -list -v -keystore "${keystore}" -alias androiddebugkey -storepass android -keypass android`,
  { encoding: 'utf8' },
);

const sha1 = out.match(/SHA1:\s*([^\n]+)/i)?.[1]?.trim();
const sha256 = out.match(/SHA256:\s*([^\n]+)/i)?.[1]?.trim();

console.log('\nKeystore debug (com.t2tacademy.app / expo run:android):\n');
if (sha1) console.log('SHA-1:  ', sha1);
if (sha256) console.log('SHA-256:', sha256);
console.log(
  '\nFirebase → questly-flutter → Configuracion del proyecto → Tus apps → Android (com.t2tacademy.app)',
);
console.log('Anade SHA-1 si falta, guarda, descarga google-services.json y ejecuta: npm run sync-google-services\n');
