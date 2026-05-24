/**
 * Genera assets/icon.png y assets/favicon.png (solo en tu PC).
 * No incluir sharp en package.json: rompe EAS Build en monorepos.
 * Uso: npx --yes -p sharp@0.34.5 node scripts/generate-app-icon.cjs
 *   o: cd apps/mobile && npm install sharp@0.34.5 --no-save && node scripts/generate-app-icon.cjs
 */
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const brandBg = '#1D083A';
const brandFg = '#FFFFFF';

const svgIcon = (size, fontSize, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${brandBg}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="${brandFg}">${label}</text>
</svg>`;

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

  fs.mkdirSync(assetsDir, { recursive: true });

  const iconPath = path.join(assetsDir, 'icon.png');
  const faviconPath = path.join(assetsDir, 'favicon.png');

  await sharp(Buffer.from(svgIcon(1024, 220, 'T2T'))).png().toFile(iconPath);
  await sharp(Buffer.from(svgIcon(48, 18, 'T2'))).png().toFile(faviconPath);

  console.log('OK', iconPath);
  console.log('OK', faviconPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
