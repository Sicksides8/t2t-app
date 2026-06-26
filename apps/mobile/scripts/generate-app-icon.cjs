/**
 * Genera icon.png, favicon.png y notification-icon.png desde assets/logo-t2t.png.
 * No incluir sharp en package.json: rompe EAS Build en monorepos.
 * Uso: npx --yes -p sharp@0.34.5 node scripts/generate-app-icon.cjs
 *   o: cd apps/mobile && npm install sharp@0.34.5 --no-save && node scripts/generate-app-icon.cjs
 */
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const logoPath = path.join(assetsDir, 'logo-t2t.png');
const brandBg = '#1D083A';

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error(
      'sharp no esta instalado (a proposito, para no romper EAS).\n' +
        'Ejecuta: cd apps/mobile && npx --yes -p sharp@0.34.5 node scripts/generate-app-icon.cjs',
    );
    process.exit(1);
  }

  if (!fs.existsSync(logoPath)) {
    console.error('No se encontro', logoPath);
    process.exit(1);
  }

  fs.mkdirSync(assetsDir, { recursive: true });

  const iconPath = path.join(assetsDir, 'icon.png');
  const faviconPath = path.join(assetsDir, 'favicon.png');
  const notificationPath = path.join(assetsDir, 'notification-icon.png');

  const logo = sharp(logoPath).ensureAlpha();

  await logo
    .clone()
    .resize(1024, 1024, { fit: 'contain', background: brandBg })
    .png()
    .toFile(iconPath);

  await logo
    .clone()
    .resize(48, 48, { fit: 'contain', background: brandBg })
    .png()
    .toFile(faviconPath);

  // Android: icono de notificacion en blanco sobre fondo transparente.
  await logo
    .clone()
    .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .tint({ r: 255, g: 255, b: 255 })
    .png()
    .toFile(notificationPath);

  console.log('OK', iconPath);
  console.log('OK', faviconPath);
  console.log('OK', notificationPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
