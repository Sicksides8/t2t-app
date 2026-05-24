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

Si el panel `/admin` pide un índice compuesto (`status` + `createdAt`), ejecutá el deploy de índices o usá el enlace que muestra la consola de Firebase. El código del panel evita ese índice para listas filtradas pequeñas; el índice sigue recomendado en producción.
