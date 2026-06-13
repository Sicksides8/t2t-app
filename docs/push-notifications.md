# Push notifications · T2T Academy

> Esta guía describe los templates de notificaciones push que envía T2T Academy
> y los assets que necesita el cliente para renderizarlas correctamente.
> La captura de referencia es `77_Push_Templates` (lock screen iOS).

## Asset · `notification-icon.png`

- Archivo: `apps/mobile/assets/notification-icon.png`
- Tamaño: **1024×1024** PNG con padding (la zona segura es 768×768)
- Fondo: morado `#B73CEF` con el monograma blanco "T2T" (Poppins Bold)
- Color de tinte: `#B73CEF` (definido en `app.json → notification.color`)

> TODO · generar el asset real cuando se pueda exportar desde el editor de
> iconos. Hoy el cliente apunta a `./assets/notification-icon.png`; si el
> archivo no existe, Expo usa el monocromo `icon.png` por defecto.

`app.json` ya está configurado con:

```jsonc
"notification": {
  "icon": "./assets/notification-icon.png",
  "color": "#B73CEF",
  "androidMode": "default"
}
```

Y el plugin `expo-notifications` recibe los mismos parámetros para Android 12+.

## Templates iniciales

Todos los pushes utilizan el monograma anterior. El campo `data` se pasa a la
app para deep-link/segmentación.

| id                | title                            | body                                                        | iconHint | color     |
|-------------------|----------------------------------|-------------------------------------------------------------|----------|-----------|
| `streak_warning`  | ¡Tu racha está en peligro!       | Hacé tu sesión hoy y mantené tus **{streakDays}** días      | `flame`  | `#FF7A1A` |
| `daily_routine`   | Hora de tu rutina                | Tenés **{min} minutos** para tu sesión de hoy               | `time`   | `#B73CEF` |

### `streak_warning`

```json
{
  "to": "ExponentPushToken[xxxxxxxx]",
  "title": "¡Tu racha está en peligro!",
  "body": "Hacé tu sesión hoy y mantené tus 7 días",
  "sound": "default",
  "data": { "type": "streak", "streakDays": 7 }
}
```

### `daily_routine`

```json
{
  "to": "ExponentPushToken[xxxxxxxx]",
  "title": "Hora de tu rutina",
  "body": "Tenés 15 minutos para tu sesión de hoy",
  "sound": "default",
  "data": { "type": "lesson", "min": 15, "routineId": "today" }
}
```

## Cómo navegar el deep-link en cliente

El listener de notificaciones (en `apps/mobile/src/services/notificationService.ts`)
ya está preparado para recibir `data.type` y routear:

- `streak` / `achievement` → `ProfileTab → NotificationsList`
- `lesson` → `HomeTab` (rutina de hoy)
- `system` → no-op (informativo)

## Out of scope

El envío real desde el backend (Cloud Functions / FCM) queda fuera del scope
de este plan. Cuando se conecte el server-side, los payloads ya tendrán los
templates listados arriba.
