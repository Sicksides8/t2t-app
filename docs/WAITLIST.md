# T2T Waitlist — landing y panel admin

App independiente en `apps/waitlist-web` (Next.js, puerto **3001** en desarrollo).

## Desarrollo

```bash
cp apps/waitlist-web/.env.local.example apps/waitlist-web/.env.local
# Completar Resend, MAILER_ADMIN_* y (si hace falta) Firebase Admin
npm install
npm run waitlist:dev
```

**Firebase en local:** Next carga automáticamente `apps/web-crm/.env` si existe (credenciales `FIREBASE_*`). Si no, copiá esas variables al `.env.local` de waitlist-web.

## URLs

| Ruta | Uso |
|------|-----|
| `/` | Landing pública (formulario de lista de espera) |
| `/admin` | Panel interno: ver leads e invitar a la beta |

### Panel admin (`/admin`)

Login con usuario y contraseña definidos en el entorno:

- `MAILER_ADMIN_USER`
- `MAILER_ADMIN_PASSWORD`

Desde ahí podés filtrar pendientes / invitados y usar **Invitar a beta** (envía email vía Resend).

## API (opcional, curl)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/waitlist` | — | Alta en lista de espera |
| GET | `/api/admin/waitlist?status=pending` | Basic | Listar registros |
| POST | `/api/admin/testers` | Basic | Invitar y enviar email beta |

```bash
curl -X POST http://localhost:3001/api/admin/testers \
  -u "admin:tu-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com"}'
```

## Variables de entorno

Ver `apps/waitlist-web/.env.local.example` (`RESEND_API_KEY`, `WAITLIST_FROM_EMAIL`, `PLAY_STORE_URL`, `MAILER_ADMIN_*`, etc.).

## Emails

| Momento | Asunto |
|---------|--------|
| Alta en waitlist | Confirmación de lista de espera |
| Invitación a beta | Acceso a la beta cerrada (Google Play + App Store si `APP_STORE_URL` está definida) |

## Firestore

Colección `t2t_waitlist`. Reglas: solo Admin SDK.

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Build falla por "secrets scanning" (AIza en google-services.json)

El sitio waitlist comparte repo con `apps/mobile`. En `apps/waitlist-web/netlify.toml` está `SECRETS_SCAN_OMIT_PATHS` para excluir mobile/CRM del escáner. Si cambiás la config, no quites esa variable sin sanitizar esos archivos.

Si el panel `/admin` pide un índice compuesto (`status` + `createdAt`), ejecutá el deploy de índices o usá el enlace que muestra la consola de Firebase. El código del panel evita ese índice para listas filtradas pequeñas; el índice sigue recomendado en producción.

## Deploy en Netlify (sitio separado del CRM)

El **web-crm** y la **waitlist** son **dos sitios distintos** en Netlify, ambos apuntan al mismo repo `t2t-app` y branch `main`.

### Crear el segundo sitio

1. Netlify → **Add new site** → **Import an existing project**.
2. Mismo proveedor Git y repo **`t2t-app`** que el CRM.
3. Branch: **`main`**.
4. **No copies** la config del sitio del CRM; configurá la waitlist así:

| Campo | Valor |
|--------|--------|
| **Site name** | ej. `t2t-waitlist` (distinto al del CRM) |
| **Base directory** | *(vacío = raíz del repo)* |
| **Package directory** | `apps/waitlist-web` |
| **Build command** | *(vacío; usa `apps/waitlist-web/netlify.toml`)* |
| **Publish directory** | *(vacío; lo gestiona el plugin de Next.js)* |

No pongas **Base directory** en `apps/waitlist-web` si el comando hace `cd ../..`: con **Package directory** el build ya corre desde la raíz. El `netlify.toml` ejecuta `npm ci && npm run waitlist:build` en el monorepo.

### Variables de entorno (solo en el sitio waitlist)

Configuralas en **Site configuration → Environment variables** del sitio nuevo (no en el del CRM):

- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `RESEND_API_KEY`, `WAITLIST_FROM_EMAIL=onboarding@resend.dev`
- `PLAY_STORE_URL`, `APP_STORE_URL` (opcional)
- `MAILER_ADMIN_USER`, `MAILER_ADMIN_PASSWORD`
- `WAITLIST_ALLOWED_ORIGINS` → opcional en producción: Netlify ya expone `URL` y se acepta automáticamente. En local usá `http://localhost:3001`. Si definís la variable, incluí también tu dominio custom.

`FIREBASE_PRIVATE_KEY`: pegá la clave con `\n` literales o usá el editor multilínea de Netlify.

### Resumen

| | CRM | Waitlist |
|---|-----|----------|
| Carpeta | `apps/web-crm` | `apps/waitlist-web` |
| Sitio Netlify | el que ya tenés | **uno nuevo** |
| URL | dominio del CRM | dominio distinto (ej. waitlist.t2t.com) |
