# Checklist Penpot ↔ App móvil (76 frames)

Fuente: `Resources/Diseño/T2TAcademy.pen`

| Frame | Estado | Notas |
|-------|--------|-------|
| 01_Splash | OK | `SplashPenpotScreen` auto-advance |
| 02_Welcome | OK | `OnboardingStorySlide` |
| 03–08 Story | OK | `penpotFrames` + story slides |
| 09–23 Q | OK | `DiagnosticQuestionScreen` por pregunta |
| 21, 24–29 T | OK | `PenpotThinkingScreen` |
| 30_Resultado | OK | `DiagnosticResultCarousel` |
| 31_Cierre | OK | `PenpotClosureScreen` onboarding + hooks |
| 32–35 Auth | OK | `AuthPenpotShell`, OTP, Firebase Apple OAuth |
| 36–51 Hooks | OK | `HooksFlowScreen` + componentes hooks |
| 52_Home | OK | Home components |
| 53_Explorar | OK | Explore |
| 54_Filtros | OK | `CourseFiltersSheet` |
| 55_Catalogo | OK | `SkillCatalogScreen` |
| 56_Curso_Detalle | OK | `CourseDetailScreen` |
| 57_Reproductor | OK | `VideoPlayerScreen` |
| 58_Modulo_Modal | OK | `ModuleCompleteModal` |
| 59_Curso_Modal | OK | `CelebrationModal` variant course |
| 60_Mis_Cursos | OK | `MyCoursesScreen` |
| 61–71 Perfil | OK | `ProfileScreens` + profile components |
| 72_Push | N/A | CRM / push templates |
| 73_Offline | OK | `GlobalNetworkGate` + `OfflineScreen` |
| 74_Error | OK | `AppErrorBoundary` + `ErrorScreen` |
| 75_Mantenimiento | OK | `MAINTENANCE_MODE` env + pantalla |
| 76_Vacios | OK | `EmptyState` + `EmptyBoardScreen` |

Verificación: `cd apps/mobile && npx tsc --noEmit`
