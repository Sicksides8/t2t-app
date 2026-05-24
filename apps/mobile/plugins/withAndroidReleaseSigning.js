const { withAppBuildGradle } = require('@expo/config-plugins');

const KEYSTORE_LOADER = `
    def keystorePropertiesFile = rootProject.file("keystore.properties")
    def keystoreProperties = new Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    }
`;

const RELEASE_SIGNING = `
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`;

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      return cfg;
    }

    let contents = cfg.modResults.contents;
    if (contents.includes('keystorePropertiesFile')) {
      return cfg;
    }

    if (!contents.includes('signingConfigs {')) {
      console.warn('[withAndroidReleaseSigning] No se encontró signingConfigs en build.gradle');
      return cfg;
    }

    contents = contents.replace(
      /(\s+)signingConfigs\s*\{/,
      `$1${KEYSTORE_LOADER.trim()}\n$1signingConfigs {`,
    );

    contents = contents.replace(
      /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\}\s*)(\})/,
      `$1${RELEASE_SIGNING}$2`,
    );

    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release',
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = withAndroidReleaseSigning;
