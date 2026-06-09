# Android release — segunda cuenta dev (cliente)

Checklist para subir T2T Academy a una cuenta de Google Play distinta de la original.

> **Por qué existe este doc:** Google Play exige que el `applicationId` (package name) sea único globalmente. El package `com.t2tacademy.app` quedó reservado a la cuenta dev original. Para subir a la cuenta del cliente usamos **`com.t2tacademy.mobile`** como package nuevo.

Lo que ya está aplicado en el repo:

- `apps/mobile/app.json` → `android.package` = `com.t2tacademy.mobile`
- `apps/mobile/android/app/build.gradle` → `namespace` + `applicationId` = `com.t2tacademy.mobile`, `versionCode` = 1
- `bundleIdentifier` iOS sin cambios (`com.t2tacademy.app`)
- `scheme` deep-link sin cambios (`t2tacademy`)

Falta hacer todo lo de abajo **antes** del primer `eas build -p android` para la cuenta del cliente.

---

## 1. Firebase (`questly-flutter` compartido)

1. [Firebase Console](https://console.firebase.google.com/) → proyecto `questly-flutter` → **Project settings → Your apps → Add app → Android**.
2. Package name: `com.t2tacademy.mobile`. App nickname libre (sugerido: `T2T Android (cliente)`).
3. Descargar el `google-services.json` nuevo (ahora trae **3 clients**: los 2 viejos + el nuevo).
4. Reemplazar [`apps/mobile/google-services.json`](./google-services.json) con el descargado.
5. Verificar que el nuevo bloque tenga `"package_name": "com.t2tacademy.mobile"` y `oauth_client` propio.

> Sin este reemplazo el build Android va a fallar con `No matching client found for package name 'com.t2tacademy.mobile'`.

---

## 2. Keystore de release

**No reusar el keystore actual (`credentials/t2t-upload.keystore`).** El cliente tiene que ser dueño de su upload key.

Opción recomendada — generar uno nuevo localmente y entregarlo:

```bash
keytool -genkeypair -v \
  -keystore credentials/t2t-upload-client.keystore \
  -alias t2t-upload-client \
  -keyalg RSA -keysize 2048 -validity 10000
```

Después, actualizar `apps/mobile/android/app/keystore.properties` (o crear uno paralelo) apuntando al keystore nuevo:

```
storeFile=../../credentials/t2t-upload-client.keystore
storePassword=<nuevo>
keyAlias=t2t-upload-client
keyPassword=<nuevo>
```

Sacar SHA-1 del keystore nuevo (lo vamos a necesitar en Firebase y Google Cloud):

```bash
keytool -list -v -keystore credentials/t2t-upload-client.keystore -alias t2t-upload-client
```

> **Alternativa EAS-managed credentials:** correr `eas credentials` desde la nueva cuenta de Expo y dejar que EAS genere y guarde el keystore. En ese caso el cliente queda dueño vía la cuenta EAS.

---

## 3. Google Cloud Console — OAuth Client IDs

Para que Google Sign-In siga funcionando con el nuevo package:

1. [Google Cloud Console](https://console.cloud.google.com/) → proyecto del que vive `questly-flutter` (mismo `project_number: 34025167590`) → **APIs & Services → Credentials**.
2. **Create credentials → OAuth client ID → Android**.
3. Package name: `com.t2tacademy.mobile`. SHA-1 del keystore release del paso 2.
4. Repetir para el SHA-1 del **debug keystore** (si querés probar `expo run:android` con el nuevo package).
5. Volver a Firebase Console → Android app `com.t2tacademy.mobile` → **Add fingerprint** → cargar los mismos SHA-1.
6. Descargar **otra vez** `google-services.json` (ya con los fingerprints) y reemplazar.

---

## 4. Play App Signing (cuenta del cliente)

En Google Play Console del cliente:

1. Crear app nueva → nombre `T2T Academy` (o el que defina el cliente).
2. Setup → **App integrity → App signing → Use Play App Signing** → subir el upload certificate del nuevo keystore (lo extraés con `keytool -export-cert`) o dejar que Play genere y vos firmás con tu upload key.
3. Completar fichas obligatorias: privacy policy URL, content rating, target audience, data safety, etc.

---

## 5. EAS / expo.dev

Hoy `app.json` apunta a:

```
"extra.eas.projectId": "202571bd-feab-43c3-9eb0-ef2a2ce0bc63"
"owner": "chillpenguin222"
```

Cuando estés listo para buildear desde la cuenta del cliente:

1. En [expo.dev](https://expo.dev) con la cuenta del cliente → crear proyecto nuevo `t2t-academy` (o el nombre que prefieran).
2. Actualizar `app.json` → `extra.eas.projectId` con el nuevo project ID, y `owner` con el username de la cuenta del cliente.
3. Cargar todas las `EXPO_PUBLIC_*` como Environment Variables del nuevo proyecto EAS (los valores de Firebase son los mismos porque compartimos `questly-flutter`).
4. Login y build:

```bash
cd apps/mobile
npx eas-cli@latest login   # con la cuenta del cliente
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest submit --platform android --profile production --latest
```

> Si querés mantener en paralelo la build de tu cuenta original (`com.t2tacademy.app`), conviene tener un branch git distinto por cada cuenta, o parametrizar el package vía variables de build. Por ahora el repo apunta a la versión cliente.

---

## 6. Smoke test antes de submit (cuenta cliente)

- Login email/contraseña → Firestore lee/escribe.
- Google Sign-In en dispositivo físico con el AAB firmado por el nuevo keystore.
- Push notifications (FCM): el `mobilesdk_app_id` nuevo debería estar en el `google-services.json` actualizado.
- Deep links / OAuth callbacks usando `scheme: t2tacademy` (no cambió).
