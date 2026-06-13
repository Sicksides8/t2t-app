# T2T Academy - Firestore Schema

Todas las **colecciones raíz** usan el prefijo `t2t_` para convivir con otros productos en el mismo proyecto Firebase.

Constantes en código: `apps/mobile/src/constants/firestoreCollections.ts` y `apps/web-crm/src/lib/firestoreCollections.ts` (`FS_COL`).

## Colecciones MVP

- `t2t_users/{uid}`: perfil, role, subscriptionId, onboardingCompleted, diagnosticCompleted, notificationTokens. Campos transaccionales de email (Resend): `welcomeEmailSentAt: Timestamp` (idempotencia del welcome email; se setea la primera vez que el endpoint del CRM envía el correo) y `lastStreakWarningEmailSentAt: Timestamp` (último envío del warning anti-churn; usado por el job diario de GitHub Actions para evitar reenviar el mismo día UTC).
- `t2t_skills/{id}`: categorías de habilidades.
- `t2t_courses/{id}`: cursos publicados.
- `t2t_modules/{id}`: módulos asociados a cursos.
- `t2t_lessons/{id}`: lecciones con `videoUrl` de Firebase Storage.
- `t2t_enrollments/{userId_courseId}`: inscripción de usuario a curso.
- `t2t_progress/{uid}/t2t_user_courses/{courseId}`: progreso por curso (subcolección dedicada; no confundir con el catálogo `t2t_courses`).
- `t2t_subscriptions/{id}`: suscripción activa o histórica.
- `t2t_subscription_codes/{code}`: códigos de canje.
- `t2t_plans/{id}`: planes comerciales.
- `t2t_diagnostic_results/{uid}`: respuestas y scores del diagnóstico.
- `t2t_notifications/{id}`: notificaciones in-app/push.
- `t2t_achievements/{id}`: certificados, rachas y logros.
- `t2t_coins_transactions/{id}`: historial de coins.
- `t2t_weekly_challenges/{id}`: desafíos semanales.
- `t2t_subscription_redemptions/{id}`: registro opcional de intentos de canje (cliente).
- `t2t_config/{docId}`: configuración pública (ej. mantenimiento).
- `t2t_waitlist/{docId}`: emails de lista de espera (`email`, `status`: `pending` | `invited`, `createdAt`, `invitedAt`, `source`). Escritura solo vía Admin SDK (`apps/waitlist-web`).

## Firebase Storage

Rutas con prefijo `t2t_`: `t2t_avatars/`, `t2t_courses/`, `t2t_certificates/`.
