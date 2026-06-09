# Cloudflare R2 — Setup para subida de cursos

El CRM web sube videos (mp4/webm/mov hasta 500 MB) y thumbnails (jpg/png/webp hasta 5 MB) directamente desde el browser a un bucket R2 mediante presigned URLs (PUT). El servidor solo firma la URL; el archivo nunca pasa por la app.

## 1. Crear bucket R2

1. Cloudflare dashboard → R2 → Create bucket. Nombre sugerido: `t2t-courses`.
2. Settings → Public access → habilitar dominio público (`pub-xxxxxxxx.r2.dev`) o conectar dominio custom (ej: `media.t2t.com`).
3. Anotar la URL pública resultante (sin slash final). Esa es `R2_PUBLIC_BASE_URL`.

## 2. Crear API Token con permisos de Object Read/Write

1. R2 → Manage R2 API Tokens → Create API Token.
2. Permissions: `Object Read & Write`. Scope al bucket `t2t-courses`.
3. Guardar `Access Key ID` y `Secret Access Key`.

## 3. Configurar CORS del bucket

R2 → bucket `t2t-courses` → Settings → CORS Policy → Edit. Pegar:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://crm.t2t-academy.com"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Reemplazar el segundo origin por el dominio real del CRM en producción.

## 4. Variables de entorno en `apps/web-crm/.env`

```env
R2_ACCOUNT_ID=         # 32 chars, dashboard → R2 → API → "Account ID"
R2_ACCESS_KEY_ID=      # del API Token
R2_SECRET_ACCESS_KEY=  # del API Token
R2_BUCKET=t2t-courses
R2_PUBLIC_BASE_URL=    # ej: https://pub-xxxxxxxx.r2.dev (sin slash final)
```

Reiniciar `npm run dev` después de cambiarlas.

## 5. Verificación rápida

1. Abrir el CRM, sección Cursos → Crear curso.
2. Arrastrar un mp4 chico al uploader. Debe mostrar progreso real y, al terminar, una URL `https://pub-xxx.r2.dev/videos/...`.
3. Abrir esa URL en otra pestaña: el video debe reproducirse.

## Estructura de keys en el bucket

```
videos/
  <courseId|new>/<timestamp>-<rand>-<filename>.mp4
thumbnails/
  <courseId|new>/<timestamp>-<rand>-<filename>.jpg
```

Si el usuario reemplaza un archivo o cancela el form con cambios pendientes, el endpoint `/api/admin/uploads/cleanup` borra los huérfanos en best-effort.
