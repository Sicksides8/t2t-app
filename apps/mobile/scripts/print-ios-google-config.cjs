/**
 * Lee REVERSED_CLIENT_ID y GOOGLE_APP_ID del plist iOS para app.json / EAS secrets.
 */
const fs = require('fs');
const path = require('path');

const plistPath = path.join(__dirname, '..', 'GoogleService-Info.plist');
if (!fs.existsSync(plistPath)) {
  console.error('Falta GoogleService-Info.plist. Descargalo de Firebase (app iOS com.t2tacademy.app).');
  process.exit(1);
}

const xml = fs.readFileSync(plistPath, 'utf8');
function readKey(key) {
  const re = new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`);
  const m = xml.match(re);
  return m ? m[1] : null;
}

const reversed = readKey('REVERSED_CLIENT_ID');
const appId = readKey('GOOGLE_APP_ID');

console.log('\n--- iOS Google / Firebase (copiar a app.json y EAS) ---\n');
if (reversed) {
  console.log('iosUrlScheme (plugin @react-native-google-signin):');
  console.log(`  ${reversed}\n`);
}
if (appId) {
  console.log('EXPO_PUBLIC_FIREBASE_APP_ID (build iOS en EAS):');
  console.log(`  ${appId}\n`);
  if (appId.includes('0000000000000000000000')) {
    console.warn('AVISO: GOOGLE_APP_ID es placeholder. Reemplaza GoogleService-Info.plist desde Firebase Console.\n');
  }
}
