# Pendientes para la app móvil

Lista de funcionalidades que ya están implementadas en el CRM (`apps/web-crm`) y que **todavía no se reflejan en la app móvil** (`apps/mobile`). Cuando estemos listos para mostrarlas a los alumnos, hay que portarlas.

## Cursos

### Tipo de acceso del curso (`accessTier`)

- **Origen**: commit `11ab614` — `crm(courses): módulos, habilidad libre, tier de acceso y PDF en R2`.
- **Estado en CRM**: el creador elige `Free | Lite | Premium` al crear o editar un curso. Se persiste en `t2t_courses.{id}.accessTier`.
- **Estado en mobile**: hoy se sigue mostrando solo el booleano `isPremium` (derivado: `tier !== 'free'`).
- **Pendiente**:
  - Mapear `accessTier` al plan de suscripción del alumno (`open`, `pro`, `black`).
  - Mostrar pill/badge del tier en el catálogo y en el detalle del curso.
  - Bloquear/permitir acceso según el tier vs el plan activo del usuario.

### Niveles del alumno (`beginner | master | expert`)

- **Origen**: commit `11ab614`.
- **Estado en CRM**: el campo `Course.level` ahora se elige entre `Beginner / Master / Expert`. Los valores legacy (`intermediate`, `advanced`) siguen vigentes en datos viejos.
- **Pendiente en mobile**:
  - Actualizar el mapping de labels para mostrar `Master` y `Expert` correctamente.
  - Revisar filtros / chips por nivel en el catálogo.

### Habilidad libre (`Course.skillId`)

- **Origen**: commit `11ab614`.
- **Estado en CRM**: ya no es un set cerrado de chips; el creador escribe la habilidad como texto.
- **Pendiente en mobile**:
  - Quitar cualquier mapping hardcodeado tipo `SKILL_LABEL[skillId]` y mostrar el `skillId` capitalizado tal cual viene.
  - Agrupaciones del catálogo deberían armarse dinámicamente desde los cursos cargados.

---

## Convención

Cuando una de estas tareas se complete, borrar la sección correspondiente y dejar el commit que la cerró referenciado en el changelog del mobile (o en `docs/push-notifications.md` si conviene).
