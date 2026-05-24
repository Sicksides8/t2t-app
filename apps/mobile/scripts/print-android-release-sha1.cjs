/**
 * SHA-1/SHA-256 del keystore de producción (upload key).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mobileRoot = path.join(__dirname, '..');
const propsPath = path.join(mobileRoot, 'credentials', 'keystore.properties');
const secretsPath = path.join(mobileRoot, 'credentials', '.keystore-secrets.txt');

function readProps() {
  if (fs.existsSync(propsPath)) {
    const text = fs.readFileSync(propsPath, 'utf8');
    const get = (key) => text.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim();
    return { storeFile: get('storeFile'), storePassword: get('storePassword'), keyAlias: get('keyAlias') };
  }
  if (fs.existsSync(secretsPath)) {
    const text = fs.readFileSync(secretsPath, 'utf8');
    const storePass = text.match(/^Store password:\s*(.+)$/m)?.[1]?.trim();
    const alias = text.match(/^Alias:\s*(.+)$/m)?.[1]?.trim();
    const keystore = text.match(/^Keystore:\s*(.+)$/m)?.[1]?.trim();
    return { storeFile: keystore, storePassword: storePass, keyAlias: alias, absoluteKeystore: true };
  }
  console.error('No hay credentials/keystore.properties ni .keystore-secrets.txt');
  process.exit(1);
}

const props = readProps();
const keystore = props.absoluteKeystore
  ? props.storeFile
  : path.resolve(mobileRoot, 'android', 'app', props.storeFile || '../credentials/t2t-upload.keystore');

if (!fs.existsSync(keystore)) {
  console.error('No existe', keystore);
  process.exit(1);
}

const out = execSync(
  `keytool -list -v -keystore "${keystore}" -alias ${props.keyAlias || 't2t-upload'} -storepass ${props.storePassword}`,
  { encoding: 'utf8' },
);

const sha1 = out.match(/SHA1:\s*([^\n]+)/i)?.[1]?.trim();
const sha256 = out.match(/SHA-256:\s*([^\n]+)/i)?.[1]?.trim();

console.log('\nKeystore release (Play / Firebase):\n');
if (sha1) console.log('SHA-1:  ', sha1);
if (sha256) console.log('SHA-256:', sha256);
console.log('');
