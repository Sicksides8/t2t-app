# T2T Academy — Smoke test checklist (mobile)

Fecha: 31/07/2026
Device: Nubia Red Magic 9s Pro 
Build: debug local (`com.t2tacademy.mobile`)  
Billing: mock  

Marcar `[x]` cuando OK. Si falla, dejar nota bajo el item.

## Antes de empezar

- [x] Telefono USB / debugging ON (`adb devices` muestra `device`)
- [x] Metro en 8081: `cd apps/mobile && npx expo start --dev-client --port 8081`
- [x] `adb reverse tcp:8081 tcp:8081`
- [x] App nativa instalada (no Expo Go)
- [x] Sin pantalla roja al abrir

Notas setup:

---

## A. Primera experiencia (solo si es install limpio)

Si ya pasaste onboarding, podes saltar a B o borrar datos de la app.

Existe un ligero parpadeo al cambiar entre screens, agregar una animacion sutil de transicion de ser necesario

- [x] A1. Splash / bootstrap carga sin crash
- [x] A2. Onboarding: se puede avanzar entre pasos
- [x] A3. Diagnostico: responder preguntas
- [x] A4. Resultado: radar / brain map / email delivery se muestran
- [x] A5. Al terminar onboarding → llega a Auth

Notas A1:
El primer onboarding donde dice tu gimnasio mental muestra unos puntos como si fuera un carrusel que se puede mover pero no es asi, asi que revisar

Notas A2:
El onboarding funciona pero solo con el boton continuar tambien deberia funcionar con el desplazamiento del dedo 

Notas A3:
Al pasar de pregunta en pregunta hay un ligero parpadeo, creo que eso pasa en todas las screens (revisar)

Notas A4: 
Mejorar el radar porque algunos textos se cortan un poco y se solapan, la funcion de email delivery no funciona
En el paso en cuanto queres transformarte? algunos textos se cortan por ejemplo el de recomendado

Notas A5: 
tuve este error al tratar de volver atras cuando estaba en la creacion de la cuenta Require cycles are allowed, but can result in uninitialized values. Consider refactoring to remove the need for a cycle.
 ERROR  The action 'GO_BACK' was not handled by any navigator.

## Is there any screen to go back to?



## B. Autenticacion

- [x] B1. Sign up con email + password
- [x] B2. Verify email (si aplica en este entorno) o mensaje claro
- [x] B3. Login con email
- [ ] B4. Forgot password: UI y mensaje de envio
- [x] B5. Google Sign-In
- [x] B6. Logout desde Perfil y volver a Auth
- [x] B7. Login de nuevo restaura sesion / perfil

Si B5 falla: correr `cd apps/mobile && npm run android:sha1` y cargar SHA-1 en Firebase.

Notas B:

- Sign up email OK; llego mail de confirmacion; login con ese perfil OK.
- Google Sign-In OK; logout OK; re-login OK.
- Inputs de registro **y login**: el teclado tapa/opaca los campos — falta KeyboardAvoidingView / scroll a foco (el usuario no ve lo que escribe). Afecta Auth email en ambas pantallas.
- Tras auth a veces aparece `FirebaseError: Missing or insufficient permissions` (promesa uncaught). Ya no bloquea t2t_users (rules mergeadas); revisar path exacto en Metro (push token, coins, achievements write:false, u otra coleccion).

Despues del logueo pase a otro onboarding de 11 pasos que dice ¿Que queres lograr con nosotros?
Y las opciones aparecen pero algunas tienen textos largos que hacen que se corten sus nombres 
El paso entre paso y paso en este onboarding es muy lento
Siento que este onboarding esta un poco de mas porque me pregunta demasiadas cosas y ya vengo de otro onboarding largo revisar
Recien pase al paso C 

## C. HooksFlow (post-login, si `onboardingCompleted` = false)

- [x] C1. Input de nombre / datos basicos
- [x] C2. Selecciones (chips / listas) bloquean avanzar sin elegir
- [x] C3. Video de bienvenida (play / skip si existe)
- [x] C4. Pricing / trial (mock): se puede continuar sin cobro real
- [x] C5. Redeem code: UI abre (codigo invalido muestra error claro)
- [x] C6. Al terminar → entra a tabs Main

Notas C:
El paso entre paso y paso es muy lento 
Pase a una screen con diferentes planes pero no se distingue bien que plan estoy seleccionando
Pase a la eleccion de un rango de edad
Recien llegue a la confirmacion del plan y puedo agregar un codigo, el texto de tenes un codigo canjealo se confunde y esta un poco saturado con respecto al fondo 
Entre a esa opcion y puse un codigo cualquiera y no me tomo el codigo que esta perfecto pero esta usando un alert nativo de android y deberiamos usar alguno nativo y mas personalizado para no romper con la estetica de la app
Recien pase al video de bienvenida que anda perfecto
Puse ir al inicio y tengo este error 
This is a development-only warning and won't be shown in production.
 WARN  [Auth] Google sign-in failed [FirebaseError: Missing or insufficient permissions.]
 WARN  [2026-08-01T01:44:56.152Z]  @firebase/firestore: Firestore (12.13.0): RestConnection RPC 'BatchGetDocuments' 0x51a59a2b failed with error:  {"code":"permission-denied","name":"FirebaseError"} url:  [https://firestore.googleapis.com/v1/projects/questly-flutter/databases/(default)/documents:batchGet?key=AIzaSyDQuwAZ-Bcao9TuQ7sFVLH4ucsY4juBDz4](https://firestore.googleapis.com/v1/projects/questly-flutter/databases/(default)/documents:batchGet?key=AIzaSyDQuwAZ-Bcao9TuQ7sFVLH4ucsY4juBDz4) request: {"documents":["projects/questly-flutter/databases/(default)/documents/t2t_users/dpVtJckQ4DaYnV3Kt0inSLxclfB3"]}
 WARN  [PushNotificationManager] No se pudo registrar push token [FirebaseError: Missing or insufficient permissions.]
 ERROR  [Error: Uncaught (in promise, id: 0): "FirebaseError: Missing or insufficient permissions."]
 toque muchas veces el boton de ir al inicio y me hizo multiples promesas, nose si deberiamos manejarlo ahi 
  ERROR  [Error: Uncaught (in promise, id: 0): "FirebaseError: Missing or insufficient permissions."]
 ERROR  [Error: Uncaught (in promise, id: 1): "FirebaseError: Missing or insufficient permissions."]
 ERROR  [Error: Uncaught (in promise, id: 2): "FirebaseError: Missing or insufficient permissions."]
 ERROR  [Error: Uncaught (in promise, id: 3): "FirebaseError: Missing or insufficient permissions."]
 ERROR  [Error: Uncaught (in promise, id: 4): "FirebaseError: Missing or insufficient permissions."]
 ERROR  [Error: Uncaught (in promise, id: 5): "FirebaseError: Missing or insufficient permissions."]
 ERROR  [Error: Uncaught (in promise, id: 6): "FirebaseError: Missing or insufficient permissions."]

---



## D. Tab Inicio (Home)

- [x] D1. Pantalla renderiza (header, orbs, sin crash)
- [x] D2. Streak / actividad visible o empty state coherente
- [x] D3. Plan / progreso visible o CTA claro
- [x] D4. Navegacion a curso / explorar desde CTA funciona

Notas D:
El renderizado de toda la screen esta bien muestra dias de seguido, plan de entrenamiento, rutina de hoy , video de bienvenida y de rutina funcionales, la parte de habilidades funciona perfecto pero se ven mal el fondo de los iconos como cuadrados al fondo

---



## E. Tab Explorar

- [x] E1. Lista / grilla de cursos carga (Firestore o empty)
- [x] E2. Filtros / chips / sheet (si hay) abren y filtran
- [x] E3. Abrir CourseDetail
- [x] E4. SkillCatalog / skill chip navega si aplica
- [x] E5. Curso premium: paywall o bloqueo coherente con mock billing

Notas E:
Mostro primero el estado empty y despues cargo la screen, los filtros andan perfectamente,al entrar a la lista de cursos anda bien y el detalle de cada curso individual tambien unicamente no es funcional el boton compartir, curso premium bloqueado correctamente, el desbloqueo funciono tambien , 

---



## F. Curso y video

- [x] F1. CourseDetail: titulo, modulos, lecciones
- [x] F2. Abrir leccion → VideoPlayer
- [x] F3. Video reproduce (expo-video)
- [x] F4. Controles / cerrar player vuelven al detalle
- [x] F5. Completar leccion / progreso se refleja (Mis cursos o detalle)

Notas F:
perfecto todo el modulo, solo que el video que aparece arriba del titulo tarda en cargar al apretarlo es como si tardara en renderizar el video, y el boton de maximizar la pantalla no funciona, los subtitulos perfectos, el recursos de modulo tambien perfecto , la carga del video aveces se traba y hace que vuelva el video al principio a veces, mejorar la barra de progreso en el detalle del curso porque no distingue porcentajes y no se sabe que es una barra de progreso, paso lo mismo en la vista de la lista de cursos la barra de progreso hay que estilizarla mejor 

---



## G. Tab Mis cursos

- [x] G1. Lista de cursos enrollados o empty state
- [x] G2. Tabs/pills internas (si hay) cambian contenido
- [x] G3. Abrir curso desde aca → CourseDetail correcto

Notas G:
Funciona bien aunque solo entro al detalle del curso cuando toco el boton continuar , tal vez seria mas facil al tocar la card simplemente, y al volver atras no vuelvo a mis cursos sino al inicio

---



## H. Tab Perfil

- [x] H1. ProfileMain: avatar, nombre, stats
- [x] H2. EditProfile: guardar cambio (nombre/avatar si se prueba)
- [x] H3. Subscription: muestra plan / mock / CTA
- [x] H4. RedeemCode
- [x] H5. CoinsHistory
- [x] H6. Progress / Certificates (UI carga; detalle si hay data)
- [x] H7. DiagnosticApp / DiagnosticRetake navegan
- [x] H8. WeeklyChallenge (si visible)
- [x] H9. NotificationsList
- [x] H10. SystemStates / Offline / Error / Maintenance (pantallas de sistema)

Notas H:

Ser mas claros con la opcion de editar perfil de suerte toque mi foto y me di cuenta que ahi podia editar mis datos, al entrar a la edicion de mis datos dice que mi email no es editable que me parece bien pero no aparece el mail con que me registre parece que es mock porque aparece [gustavo@t2t.com](mailto:gustavo@t2t.com) , mi nombre si aparece bien, tuve este error al subir una foto de perfil  WARN  [expo-image-picker] `ImagePicker.MediaTypeOptions` have been deprecated. Use `ImagePicker.MediaType` or an array of `ImagePicker.MediaType` instead.
 ERROR  [Error: Uncaught (in promise, id: 0): "TypeError: Network request failed"]
 Tampoco se guardo mi bios ni nada por el estilo, se quedo cargando pero no me dio ningun alert de exito ni nada, parece que no es funcional la edicion de datos 

El cambiar de plan el boton no se distingue pense que era un texto y no un boton como tal, pero si me deja cambiar de plan pero hay que mejorar los alerts porque se usan alerts nativos de android, el boton pasate a anual y ahorra 20% parece que es mock porque lo apreto y no hace nada , se muestra un historial de pagos pero tambien parece mock

El canje de codigo parece funcional pero al tener ya una suscricpion no puedo usarlo pero si funciona que me mande a mi suscripcion 

El historial de coins parece que funciona pero tengo 0 asi que no puedo ver mas nada ahi

El progreso esta como proximamente

El diagnostico aparece correctamente pero es como te digo algunos textos estan cortados por la screen y algunos se solapan, funciona el boton rehacer diagnostico perfectamente, tambien el compartir resultado, el actualizar mi plan no, me llevo al inicio nose porque 

El desafio semanal aparece pero en la parte de configuracion nose si deberia estar ahi, la screen funciona y probe hacer mi reflexion y se mando bien pero seguimos usando alerts nativos, y al entrar de nuevo a la screen aparece mi reflexion

La screen de notificaciones al parecer anda pero no tengo avisos asi que no puedo hacer mas ahi

Todas las opciones que se encuentran adentro de la screen de ajustes al parecer son para el desarrollador y no para el usuario final pero no funcionan como tal al parecer 

---



## I. Red y resiliencia

- [x] I1. Con datos: app usable
- [x] I2. Modo avion unos segundos: banner / gate / mensaje (no crash)
- [x] I3. Volver online: se recupera sin reinstalar

Notas I:

## Al usar el modo avion me aparece el aviso de sin conexion asi que perfecto, al retomar mi conexion volvi donde estaba asi que perfecto, tambien hice la prueba con datos (y eso que tengo pocos) y me carga todo bien o creo que no tanto porque quise abrir un video y tuve esto  WARN  [2026-08-01T03:31:50.688Z]  @firebase/firestore: Firestore (12.13.0): WebChannelConnection RPC 'Write' stream 0x2861646c transporterrored. Name: undefined Message: undefined
 WARN  [2026-08-01T03:31:55.772Z]  @firebase/firestore: Firestore (12.13.0): WebChannelConnection RPC 'Write' stream 0x2861646d transporterrored. Name: undefined Message: undefined
Al activar mi wifi de nuevo se soluciono, tal vez el problema es que tengo pocos datos



## J. Extras (opcional en este pase)

- [ ] J1. Push: permiso de notificaciones (Android 13+)
- [ ] J2. Deep link / scheme `t2tacademy` (si hay caso de prueba)
- [x] J3. Rotacion / back button Android no rompe stacks

Notas J:

Trate de usar el mobile con la rotacion automatica activada pero en la app no hubo efecto alguno, ni en los videos ni nada y el boton para volver atras nativo de la barra de navegacion de android funciona cuando lo apreto muchas veces recien o depende a veces si anda perfecto

---



## Resumen del pase


| Area        | Resultado (OK / FAIL / SKIP)                                                                                                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Setup       | OK                                                                                                                                                                                                                                                                     |
| Onboarding  | OK con UX notes (parpadeo, carrusel falso, swipe, textos cortados, email delivery)                                                                                                                                                                                     |
| Auth        | OK funcional (Google + email signup/verify/login + logout). Falta Forgot password. Teclado: CODE FIX 2026-08-04 (re-probar). permission-denied: catches en codigo.                                                                                                      |
| Hooks       | OK con UX notes (lento, planes poco claros, alert nativo, onboarding largo). Debounce Ir al inicio: CODE FIX 2026-08-04.                                                                                                                                               |
| Home        | OK tras fix rules Firestore; iconos skill con fondo cuadrado feo                                                                                                                                                                                                       |
| Explorar    | OK — empty flash al cargar; compartir no funciona; paywall/desbloqueo OK                                                                                                                                                                                               |
| Curso/video | OK — lag al abrir video; maximizar no anda; a veces rewind; barras de progreso poco claras                                                                                                                                                                             |
| Mis cursos  | OK — solo abre con Continuar (no toda la card); back vuelve a Inicio en vez de Mis cursos                                                                                                                                                                              |
| Perfil      | CODE FIX 2026-08-04 — edit profile (bio/avatar/email); re-probar en device. Siguen: alerts nativos; CTA anual; progreso “proximamente”; diagnostico textos; SystemStates debug                                                                                         |
| Red         | OK — banner offline + recover; WebChannel warn con datos moviles al abrir video                                                                                                                                                                                        |
| Extras      | PARCIAL — rotacion no rota la app; back Android inconsistente; push/deep link no probados                                                                                                                                                                              |


Blockers (impiden seguir con requerimientos de producto / release):

1. ~~Firestore permission-denied~~ RESUELTO — merge rules `t2t_*` en Console Prod (Elevate+Easywork intactos); playground get/create OK.
2. ~~Edicion de perfil no funcional~~ CODE FIX 2026-08-04 — bio + avatar XHR + email real + feedback in-app; **re-probar en device** (y Storage rules `t2t_avatars` en Console).
3. ~~Multi-tap en CTAs criticos (ej. Ir al inicio)~~ CODE FIX 2026-08-04 — guard `finishing` + CTA disabled/loading.
4. ~~`permission-denied` residual post-auth (uncaught)~~ CODE FIX 2026-08-04 — catches en push, refresh, hydrate, coins/achievements (write:false degradado). Si BatchGet `t2t_users` sigue, revisar rules Console.
5. ~~Auth registro y login: teclado tapa inputs~~ CODE FIX 2026-08-04 — KeyboardAvoidingView en AuthFormShell (iOS padding / Android height); **re-probar en device**.

Bugs / deuda UX prioritaria (del smoke):

1. Parpadeo / falta animacion entre screens; HooksFlow lento; doble onboarding largo.
2. Carrusel falso + falta swipe en onboarding; textos cortados (radar, recomendado, chips, diagnostico).
3. Email delivery diagnostico no funciona.
4. GO_BACK Auth; Alert.alert nativo (codigo, plan, desafio) → usar UI in-app.
5. Home: fondos iconos skill cuadrados.
6. Explorar: compartir no funcional; flash empty → data.
7. Video: delay al abrir, maximizar roto, a veces se traba y reinicia; barras progreso poco legibles (detalle + lista).
8. Mis cursos: tap en card; back stack incorrecto.
9. Perfil: affordance editar poco clara; boton cambiar plan / anual poco visibles; “actualizar mi plan” desde diagnostico → Home; SystemStates en ajustes de usuario.
10. Rotacion no soportada / no tiene efecto; back Android irregular.

Siguiente paso: re-probar Fase 1 en device; luego UX critica smoke (share, Mis cursos, barras, iconos) y reqs CRM.