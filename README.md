# T2T Academy

Monorepo de la plataforma T2T Academy.

## Estructura

- `apps/mobile` — App Expo (React Native) para alumnos
- `apps/web-crm` — Panel admin Next.js
- `firebase/` — Reglas, índices y scripts de seed
## Requisitos

- Node.js 20+
- npm 10+

## Configuración

1. Clonar el repo e instalar dependencias:

```bash
npm install
```

2. Variables de entorno (no se suben al repo):

- `apps/mobile/.env` — copiar desde `apps/mobile/.env.example`
- `apps/web-crm/.env.local` — copiar desde `apps/web-crm/.env.local.example`

3. Firebase: ver `firebase/README.md`

## Scripts

```bash
npm run mobile          # Expo dev server
npm run mobile:android  # Build/run Android
npm run crm:dev         # CRM en desarrollo
npm run typecheck       # Typecheck mobile + CRM
npm run seed:firestore  # Seed Firestore (requiere credenciales admin locales)
```

## Android producción (Google Play — AAB)

Keystore de subida en `apps/mobile/credentials/` (no se sube a git). Tras `prebuild`, el script copia `keystore.properties` a `android/`.

```bash
cd apps/mobile
npm run prebuild:android   # si cambiaste plugins nativos, app.json o google-services.json
npm run bundle:android     # AAB firmado para Play Console
```

AAB: `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`

SHA-1 del keystore de release: `npm run android:sha1:release` (desde `apps/mobile`).

## iOS producción (App Store — EAS, sin Mac)

Build en la nube de [Expo EAS](https://expo.dev). Sign in with Apple es **nativo en iOS**; Google Sign-In en iOS y Android. El botón Apple no se muestra en Android.

Checklist de consolas (Firebase iOS, Apple Developer, secrets): [`apps/mobile/IOS_RELEASE_CHECKLIST.md`](apps/mobile/IOS_RELEASE_CHECKLIST.md).

```bash
cd apps/mobile
npm run ios:google-config   # tras reemplazar GoogleService-Info.plist desde Firebase
npx eas-cli login
npx eas-cli init            # pega projectId en app.json → extra.eas.projectId
npm run eas:build:ios       # .ipa en expo.dev
npm run eas:submit:ios      # sube a App Store Connect
```

Iconos de tienda: `npm run generate:icons` (requiere `sharp` devDependency en mobile).
