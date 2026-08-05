# T2T Academy — Contexto del proyecto (vivo)

> Este archivo es el `CONTEXT.md` del repo (nombre historico: `PROJECT_CONTEXT.md`). No crear otro paralelo.
> Actualizar con cambios relevantes para handoff entre chats.

## Handoff (ultimo)

- Hecho: CRM listo para **Vercel** (`apps/web-crm/vercel.json` install/build desde monorepo); avatar R2 + coins refresh; `.env.local.example` CRM actualizado.
- Abierto: **deploy Vercel** (Root Directory `apps/web-crm`, pegar env del `.env` local); luego setear `EXPO_PUBLIC_API_BASE_URL` en mobile al dominio `.vercel.app`; agregar dominio en Firebase Auth → Authorized domains; CORS R2 con `*.vercel.app` si hace falta para CRM browser.
- Archivos clave: `apps/web-crm/vercel.json`, `apps/web-crm/.env.local.example`, `apps/mobile/.env`

## Deploy CRM (Vercel)

1. Vercel → Add Project → repo `t2t-app`.
2. **Root Directory:** `apps/web-crm` (usa `vercel.json`: install/build desde la raíz del monorepo).
3. Environment Variables: copiar todas las de `apps/web-crm/.env` (ver `.env.local.example`). `FIREBASE_PRIVATE_KEY` con `\n` literales.
4. Deploy → anotar URL `https://….vercel.app`.
5. Firebase Console → Authentication → Settings → **Authorized domains** → agregar `….vercel.app`.
6. Mobile: `EXPO_PUBLIC_API_BASE_URL=https://….vercel.app` (sin slash) → reiniciar Metro.
7. Probar: login CRM + `POST /api/uploads/avatar-presign` (avatar desde la app).

## Mapa de la app (smoke test)

Flujo de navegacion (`RootNavigator`):

1. Primera vez: Splash → Onboarding (+ diagnostico radar/brain/email)
2. Auth: SignUp / Login / ForgotPassword / VerifyEmail (email + Google; Apple solo iOS)
3. Post-login sin `onboardingCompleted`: HooksFlow (nombre, preferencias, video welcome, pricing/trial mock, redeem code)
4. App principal (tabs): Inicio | Explorar | Mis cursos | Perfil
5. Stacks globales: CourseDetail, SkillCatalog, VideoPlayer

Checklist marcable: [`docs/QA_SMOKE_CHECKLIST.md`](./QA_SMOKE_CHECKLIST.md).

Pendientes de producto ya documentados: `docs/PENDING_MOBILE_FEATURES.md` (accessTier, levels, skill libre).

Billing en builds locales/EAS: `EXPO_PUBLIC_BILLING_MODE=mock` (no cobra Play real).

## Resumen

Monorepo npm workspaces de T2T Academy.

- **Mobile (alumnos):** Expo SDK 55 + React Native 0.83 + React 19 (`apps/mobile`)
- **CRM admin:** Next.js 16 (`apps/web-crm`)
- **Waitlist:** `apps/waitlist-web`
- **Firebase:** proyecto compartido `questly-flutter` (colecciones `t2t_*`)
- **Media:** Cloudflare R2
- **Billing actual:** mock (`EXPO_PUBLIC_BILLING_MODE=mock`)

## Apps y IDs

| Superficie | ID |
|---|---|
| Android package | `com.t2tacademy.mobile` |
| iOS bundle | `com.t2tacademy.app` |
| Expo slug | `t2t-academy` |
| EAS projectId | `202571bd-feab-43c3-9eb0-ef2a2ce0bc63` |
| Scheme | `t2tacademy` |

## Cómo probar mobile en teléfono físico (NO Expo Go)

Motivo: notificaciones, Google Sign-In, IAP, video nativo, plugins custom.

### Requisitos locales

- Node 20+, npm 10+
- Android Studio (SDK + platform-tools)
- JDK 17
- USB debugging en el teléfono **o** emulador

### Rol de Android Studio

Android Studio **no se usa para codear** la app (eso es Cursor + Expo). Sirve para:

1. Instalar el **Android SDK** (plataformas, build-tools, platform-tools)
2. Gestionar el **emulador** (opcional)
3. **Abrir** la carpeta `apps/mobile/android` **después** del prebuild si hay que depurar Gradle/Kotlin

**No** crear un "New Project" desde Android Studio. El proyecto nativo lo genera Expo con `prebuild`.

### Setup SDK (primera vez en Android Studio)

1. Abrir Android Studio → pantalla Welcome
2. **More Actions** → **SDK Manager**
3. Tab **SDK Platforms**: marcar **Android 15 (API 35)** y/o la más reciente recomendada
4. Tab **SDK Tools**: marcar
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools
   - Android Emulator (si vas a usar emulador)
5. Apply / OK y esperar a que descargue

Rutas típicas en Windows:

- SDK: `C:\Users\<user>\AppData\Local\Android\Sdk`
- Variable de entorno: `ANDROID_HOME` (o `ANDROID_SDK_ROOT`) apuntando a esa carpeta
- JDK: 17 (`JAVA_HOME` opcional pero recomendado)

### Primera vez / tras cambiar nativo

```bash
# raíz del monorepo
npm install

# apps/mobile: asegurar .env (copiar desde .env.example si falta)
cd apps/mobile

# Si hay errores raros de Kotlin/Gradle: borrar la carpeta android/ y regenerar
npm run prebuild:android
npm run android
```

`prebuild:android` genera `android/`, sincroniza `google-services.json` y configura signing local.

### Día a día (solo JS/TS)

```bash
# raíz
npm run mobile
# la app nativa ya instalada se conecta a Metro (hot reload)
```

### Cuándo volver a prebuild

- Cambios en `app.json` (plugins, permisos, icons nativos)
- Cambios en `google-services.json` / plugins en `apps/mobile/plugins/`
- Actualización de deps nativas de Expo

### Nota Kotlin

`android/` está en `.gitignore`. No reutilizar carpeta `android` de otra máquina/versión de Expo.

Dejar que Expo prebuild fije AGP/Kotlin. **No** forzar Kotlin más viejo “porque el otro dev lo tenía”.

Si falló un prebuild a medias:

1. Borrar `apps/mobile/android`
2. (Opcional) borrar `apps/mobile/.expo`
3. `npm run prebuild:android` de nuevo

### Abrir el proyecto nativo en Android Studio (opcional, para depurar)

Solo **después** de que exista `apps/mobile/android`:

1. Android Studio → **Open**
2. Elegir la carpeta `apps/mobile/android` (no la raíz del monorepo)
3. Esperar sync de Gradle
4. Ahí se ven errores de Kotlin/AGP con más detalle

Para instalar en el teléfono seguí prefiriendo:

```bash
cd apps/mobile
npm run android
```

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm run mobile` | Metro / Expo start |
| `npm run mobile:android` | `expo run:android` |
| `cd apps/mobile && npm run prebuild:android` | Genera android + sync google-services + signing |
| `npm run crm:dev` | CRM Next |
| `npm run typecheck` | typecheck workspaces |
| `npm run seed:firestore` | seed (necesita service account local) |
| `cd apps/mobile && npm run android:sha1` | SHA-1 debug para Firebase / Google Sign-In |

## Estructura mobile (orientación)

```
apps/mobile/
  App.tsx
  app.json, eas.json
  google-services.json, GoogleService-Info.plist
  plugins/          # config plugins (Google Services, signing)
  scripts/          # prebuild helpers, SHA1, icons
  src/
    navigation/     # Root, Auth, Tabs, Profile
    screens/        # academy, auth, profile, system
    components/     # UI + flujos (diagnostic, hooks, onboarding…)
    services/       # firebase, auth, progress, push, billing…
    stores/         # zustand
    theme/, types/, utils/, constants/, data/
```

## CRM (web)

- Next App Router + API routes en `apps/web-crm/src/app/api/`
- Admin: users, courses, codes, notifications, retention, revenue
- Auth Firebase admin

## Docs existentes

- `README.md` — setup general
- `docs/FIRESTORE_SCHEMA.md`
- `docs/push-notifications.md`
- `docs/R2_SETUP.md`
- `docs/API_ENDPOINTS.md`
- `docs/QA_SMOKE_CHECKLIST.md` — smoke test marcable (Gabriel)
- `apps/mobile/ANDROID_CLIENT_RELEASE_CHECKLIST.md`
- `apps/mobile/IOS_RELEASE_CHECKLIST.md`
- `.cursor/rules/` — reglas del agente (working-style, architecture, t2t-mobile)

## Entorno de Gabriel (máquina local)

- [2026-07-31] Android Studio instalado (Narwhal 3 / 2025.1.4)
- [2026-07-31] JDK 17 OK (`openjdk 17.0.17`)
- [2026-07-31] `ANDROID_HOME=C:\Users\gabri\AppData\Local\Android\Sdk`
- [2026-07-31] `apps/mobile/.env` presente
- [2026-07-31] `prebuild` OK → carpeta `android/` generada
- [2026-07-31] Debug APK instalado en device `FY2420910142` (`com.t2tacademy.mobile`)

## Patch Expo SDK 55 (Kotlin / UnstableReactNativeAPI)

Bug conocido ([expo/expo#45297](https://github.com/expo/expo/issues/45297)): el generador de `ExpoModulesPackageList.kt` no emite `@file:OptIn(UnstableReactNativeAPI)` y falla `:expo:compileDebugKotlin` (suele apuntar a `expo-video`).

- Patch persistente: `patches/expo-modules-autolinking+55.0.22.patch`
- Se aplica en `postinstall` vía `patch-package` (root `package.json`)
- Fix upstream en SDK 56; se puede quitar el patch al migrar

## Decisiones / hallazgos del equipo

- [2026-07-31] Testing en device con prebuild local (no Expo Go).
- [2026-07-31] El “error de Kotlin” NO era versión de máquina: era el bug de OptIn de Expo 55 + `expo-video`.
- [2026-07-31] `prebuild:android` falla al final sin `credentials/` (keystore release). Para debug local no hace falta: usar `npm run android` tras un prebuild OK.
- [2026-07-31] Android Studio se usa como toolchain SDK / debug Gradle, no como IDE principal del monorepo.
- [2026-07-31] Smoke: Google Sign-In autentica, pero Firestore niega `t2t_users` (`Missing or insufficient permissions`). No es “Firebase malo”: son Security Rules del proyecto `questly-flutter`. Pedir a quien administra Firebase que confirme reglas desplegadas (o redeploy de `firebase/firestore.rules`).
- [2026-07-31] En Console: proyecto compartido `questly-flutter` (UI “bingoencasa”). Apps T2T: **T2T Academy Whapy** = `com.t2tacademy.mobile` (Android actual), **T2T Academy iOS** = `com.t2tacademy.app`. Ignorar el resto de apps del dropdown.
- [2026-08-04] Smoke blockers Fase 1 (codigo): EditProfile persiste `bio` en `t2t_users`; avatar via XHR (no `fetch(file://)`); email desde Auth/Firestore sin mock; AuthFormShell con KAV iOS+Android; finishHooks con guard busy; gamification coins/achievements degrada si write:false; hydrate RootNavigator con catch. Pendiente validar en device + Storage rules `t2t_avatars` en Console.
- [2026-08-04] Avatar → R2 (Spark bloquea Firebase Storage): endpoint `POST /api/uploads/avatar-presign` + PUT mobile. Requiere CRM desplegado / API reachable y R2 env.

## Errores conocidos / troubleshooting

| Síntoma | Qué probar |
|---|---|
| `:expo:compileDebugKotlin` + “This API is experimental” | Verificar que `npx patch-package` aplicó el patch; limpiar `node_modules/expo/android/build` y rebuild |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Desinstalar la app vieja: `adb uninstall com.t2tacademy.mobile` y volver a instalar |
| `prebuild:android` falla por keystore | Ignorar para debug; pedir `credentials/` solo para AAB release |
| Google Sign-In falla | SHA-1 debug en Firebase (`npm run android:sha1`) |
| Push no anda | Ver `docs/push-notifications.md` + build nativo |
| Falta .env | Copiar `apps/mobile/.env.example` |
| `adb devices` vacío | USB debugging ON + cable datos; aceptar RSA en el teléfono |

## Pendiente / próximos pasos

- [x] Completar SDK + prebuild + build debug en teléfono de Gabriel
- [x] Confirmar app abre y carga Metro en el device
- [x] Smoke test mobile documentado (`docs/QA_SMOKE_CHECKLIST.md`)
- [x] Firestore rules `t2t_*` en Console (merge)
- [ ] Registrar SHA-1 debug en Firebase si Google Sign-In falla
- [ ] Pedir `credentials/` al equipo solo cuando haga falta release Play
- [x] Smoke blockers Fase 1 (edit profile, KAV auth, debounce Ir al inicio, catches permission-denied)
- [ ] Re-probar blockers en device + confirmar Storage rules `t2t_avatars` en Console
- [ ] UX critica smoke (share, Mis cursos card/back, barras progreso, iconos skill) + reqs CRM
