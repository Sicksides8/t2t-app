const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Copia google-services.json desde la raíz de apps/mobile a android/app/
 * durante `npx expo prebuild` (además de lo que hace expo.android.googleServicesFile).
 */
module.exports = function withGoogleServicesAndroid(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const src = path.join(projectRoot, 'google-services.json');
      const destDir = path.join(platformRoot, 'app');
      const dest = path.join(destDir, 'google-services.json');

      if (!fs.existsSync(src)) {
        console.warn('[withGoogleServicesAndroid] No está apps/mobile/google-services.json');
        return cfg;
      }

      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
      return cfg;
    },
  ]);
};
