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

## APK Android (release)

```bash
cd apps/mobile
npm run prebuild:android   # si cambiaste dependencias nativas
cd android
./gradlew assembleRelease  # Windows: gradlew.bat assembleRelease
```

APK: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
