# iOS release (EAS) — checklist manual

Pasos en consolas que no automatiza el repo. Completar **antes** del primer `eas build -p ios` de producción.

## Firebase

1. [Firebase Console](https://console.firebase.google.com/) → proyecto `questly-flutter` → **Añadir app iOS** → bundle `com.t2tacademy.app`.
2. Descargar **GoogleService-Info.plist** y **reemplazar** [`GoogleService-Info.plist`](./GoogleService-Info.plist) (el del repo es plantilla).
3. **Authentication → Sign-in method → Apple → Habilitar**.
4. Ejecutar: `npm run ios:google-config` y copiar `EXPO_PUBLIC_FIREBASE_APP_ID` a secrets EAS.

## Google Cloud

1. Mismo proyecto OAuth → crear cliente **iOS** con bundle `com.t2tacademy.app`.
2. Tras actualizar el plist, `npm run ios:google-config` → `iosUrlScheme` en `app.json` (si cambió `REVERSED_CLIENT_ID`).

## Apple Developer

1. App ID `com.t2tacademy.app` → capability **Sign in with Apple** activada.
2. App Store Connect → app **T2T Academy** + URL política de privacidad + capturas.

## EAS

Proyecto vinculado: `extra.eas.projectId` en `app.json` (cuenta `chillpenguin222` / `t2t-academy`).

### 1. Variables de entorno en expo.dev

En [expo.dev](https://expo.dev) → proyecto **t2t-academy** → **Environment variables** → entorno **production**:

Copiar desde tu `apps/mobile/.env` todas las `EXPO_PUBLIC_*`, con **`EXPO_PUBLIC_FIREBASE_APP_ID` = valor iOS** del plist (no el `android:...`).

También: `EXPO_PUBLIC_EAS_PROJECT_ID=202571bd-feab-43c3-9eb0-ef2a2ce0bc63`

### 2. Primer build (interactivo — credenciales Apple)

```bash
cd apps/mobile
npx eas-cli@latest login
# Primera vez: configurar Distribution Certificate + Provisioning Profile (Sign in with Apple)
npx eas-cli@latest build --platform ios --profile production
```

Builds siguientes pueden usar `--non-interactive` cuando las credenciales ya existan.

### 3. Submit a App Store Connect

```bash
npx eas-cli@latest submit --platform ios --profile production --latest
```

O subir el `.ipa` manualmente en App Store Connect → TestFlight.

## TestFlight (antes de enviar a revisión)

- Login email/contraseña
- Google Sign-In en dispositivo físico
- Sign in with Apple (sheet nativo)
- `EXPO_PUBLIC_API_BASE_URL` apunta a producción
