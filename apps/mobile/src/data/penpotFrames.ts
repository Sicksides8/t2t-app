/** Manifiesto Penpot → app (T2TAcademy.pen). Fuente única de copy y metadatos por frame. */

export type PenpotOrbVariant = 'default' | 'auth' | 'diagnostic' | 'splash' | 'thinking';

export type PenpotIllustrationKey =
  | 'logo'
  | 'welcome'
  | 'story'
  | 'question'
  | 'thinking'
  | 'result'
  | 'closure'
  | 'auth'
  | 'reset'
  | 'verify'
  | 'gift';

export type PenpotFrameMeta = {
  id: string;
  penId: string;
  title: string;
  body?: string;
  orbVariant: PenpotOrbVariant;
  illustrationKey?: PenpotIllustrationKey;
};

export const PENPOT_FRAMES: Record<string, PenpotFrameMeta> = {
  '01_Splash': {
    id: '01_Splash',
    penId: '01',
    title: 'T2T Academy',
    body: 'Entrena las habilidades que transforman tu carrera.',
    orbVariant: 'splash',
    illustrationKey: 'logo',
  },
  '02_Welcome': {
    id: '02_Welcome',
    penId: '02',
    title: 'Tu gimnasio mental',
    body: 'Las habilidades blandas son músculos. Te ayudamos a entrenarlas en sesiones cortas, cada día.',
    orbVariant: 'default',
    illustrationKey: 'welcome',
  },
  '03_ComoFunciona': {
    id: '03_ComoFunciona',
    penId: '03',
    title: 'Tu plan creado con IA. Entrenado por ti.',
    body: 'T2T Academy usa IA para armar tu entrenamiento de habilidades blandas, según tu diagnóstico y tus objetivos.',
    orbVariant: 'default',
    illustrationKey: 'story',
  },
  // ============================================================
  // Carrusel onboarding (04 → 32) — copy real vive en
  // `data/onboardingFlow.ts` y `data/diagnostic.ts`.
  // Estas entries son referencia/auditoría, no se usan en render.
  // ============================================================
  '04_Impacto': {
    id: '04_Impacto',
    penId: '04',
    title: 'El mundo laboral cambió.',
    body: 'Y la mayoría todavía no lo entendió.',
    orbVariant: 'default',
  },
  '05_Identificacion': {
    id: '05_Identificacion',
    penId: '05',
    title: 'La universidad te da conocimientos.',
    body: 'La IA tampoco te lo resuelve: necesita que te entrenes.',
    orbVariant: 'default',
  },
  '06_Tension': {
    id: '06_Tension',
    penId: '06',
    title: 'Está en cómo piensas y trabajas con otros.',
    body: 'Eso se entrena y se mejora.',
    orbVariant: 'default',
  },
  '07_Diferencial': {
    id: '07_Diferencial',
    penId: '07',
    title: 'T2T tiene tu plan de entrenamiento.',
    body: 'Solo invertirás 15-30 minutos por semana.',
    orbVariant: 'default',
  },
  '08_Transformacion': {
    id: '08_Transformacion',
    penId: '08',
    title: 'quién te conviertes.',
    body: 'Lo que entrenas todos los días termina definiendo quién te conviertes.',
    orbVariant: 'default',
  },
  '09_Accion': {
    id: '09_Accion',
    penId: '09',
    title: 'Vamos a construir tu perfil profesional.',
    body: 'Sin respuestas correctas. Solo una mirada honesta a cómo entrenas hoy.',
    orbVariant: 'default',
  },
  '10_InicioDiagnostico': {
    id: '10_InicioDiagnostico',
    penId: '10',
    title: '¿Quieres saber cómo estás entrenando hoy?',
    body: 'Tu punto de partida',
    orbVariant: 'diagnostic',
  },
  '11_Q_Liderazgo': { id: '11_Q_Liderazgo', penId: '11', title: 'LIDERAZGO', orbVariant: 'diagnostic' },
  '12_Q_Influencia': { id: '12_Q_Influencia', penId: '12', title: 'INFLUENCIA', orbVariant: 'diagnostic' },
  '13_Q_Adaptabilidad': { id: '13_Q_Adaptabilidad', penId: '13', title: 'ADAPTABILIDAD', orbVariant: 'diagnostic' },
  '14_Q_Comunicacion': { id: '14_Q_Comunicacion', penId: '14', title: 'COMUNICACIÓN', orbVariant: 'diagnostic' },
  '15_T_Reflexion_Q4': {
    id: '15_T_Reflexion_Q4',
    penId: '15',
    title: 'Reflexión',
    body: 'Muy pocos entrenan cómo pensar, liderar y adaptarse.',
    orbVariant: 'thinking',
  },
  '16_T_Analizando': {
    id: '16_T_Analizando',
    penId: '16',
    title: 'Analizando cómo entrenas hoy',
    body: 'tus habilidades',
    orbVariant: 'thinking',
  },
  '17_Q_TrabajoEquipo': { id: '17_Q_TrabajoEquipo', penId: '17', title: 'TRABAJO EN EQUIPO', orbVariant: 'diagnostic' },
  '18_Q_Resolucion': { id: '18_Q_Resolucion', penId: '18', title: 'RESOLUCIÓN DE PROBLEMAS', orbVariant: 'diagnostic' },
  '19_Q_Creatividad': { id: '19_Q_Creatividad', penId: '19', title: 'CREATIVIDAD', orbVariant: 'diagnostic' },
  '20_Q_Escucha': { id: '20_Q_Escucha', penId: '20', title: 'ESCUCHA', orbVariant: 'diagnostic' },
  '21_T_Reflexion_Q8': {
    id: '21_T_Reflexion_Q8',
    penId: '21',
    title: 'Tiempo',
    body: 'Por eso empezar hoy importa.',
    orbVariant: 'thinking',
  },
  '22_T_Detectando': {
    id: '22_T_Detectando',
    penId: '22',
    title: 'Detectando fortalezas',
    body: 'y puntos ciegos',
    orbVariant: 'thinking',
  },
  '23_Q_Productividad': { id: '23_Q_Productividad', penId: '23', title: 'PRODUCTIVIDAD', orbVariant: 'diagnostic' },
  '24_Q_Aprendizaje': { id: '24_Q_Aprendizaje', penId: '24', title: 'APRENDIZAJE', orbVariant: 'diagnostic' },
  '25_Q_LiderazgoHumano': { id: '25_Q_LiderazgoHumano', penId: '25', title: 'LIDERAZGO HUMANO', orbVariant: 'diagnostic' },
  '26_Q_GestionEmocional': { id: '26_Q_GestionEmocional', penId: '26', title: 'GESTIÓN EMOCIONAL', orbVariant: 'diagnostic' },
  '27_T_Reflexion_Q12': {
    id: '27_T_Reflexion_Q12',
    penId: '27',
    title: 'Tu futuro',
    body: 'Lo que hagas después depende de tus habilidades.',
    orbVariant: 'thinking',
  },
  '28_T_Construyendo_Perfil': {
    id: '28_T_Construyendo_Perfil',
    penId: '28',
    title: 'Construyendo',
    body: 'tu perfil profesional',
    orbVariant: 'thinking',
  },
  '29_Q_Autopercepcion': { id: '29_Q_Autopercepcion', penId: '29', title: 'AUTOPERCEPCIÓN', orbVariant: 'diagnostic' },
  '30_Q_Motivacion': { id: '30_Q_Motivacion', penId: '30', title: 'MOTIVACIÓN', orbVariant: 'diagnostic' },
  '31_T_Loading_Entrenamiento': {
    id: '31_T_Loading_Entrenamiento',
    penId: '31',
    title: 'Construyendo tu entrenamiento',
    body: 'Casi listo',
    orbVariant: 'thinking',
  },
  '32_Resultado_Radar': {
    id: '32_Resultado_Radar',
    penId: '32',
    title: 'Tu perfil hoy',
    body: '12 habilidades · una mirada honesta',
    orbVariant: 'diagnostic',
    illustrationKey: 'result',
  },
  // ============================================================
  // Auth (frames legacy — keys preservadas para no romper AuthScreens
  // hasta que se redibuje auth completo).
  // ============================================================
  '36_SignUp': {
    id: '36_SignUp',
    penId: '36',
    title: 'Crea tu cuenta',
    body: 'Vamos a personalizar tu plan.',
    orbVariant: 'auth',
    illustrationKey: 'auth',
  },
  '37_Login': {
    id: '37_Login',
    penId: '37',
    title: 'Bienvenido de vuelta',
    body: 'Te esperamos en el gimnasio mental.',
    orbVariant: 'auth',
    illustrationKey: 'auth',
  },
  '38_Recuperar_Password': {
    id: '38_Recuperar_Password',
    penId: '38',
    title: 'Recupera tu contraseña',
    body: 'Te enviamos un link para restablecerla.',
    orbVariant: 'auth',
    illustrationKey: 'reset',
  },
  '39_Verificar_Email': {
    id: '39_Verificar_Email',
    penId: '39',
    title: 'Verifica tu email',
    body: 'Te enviamos un código a tu bandeja.',
    orbVariant: 'auth',
    illustrationKey: 'verify',
  },
  '33_Recibir_Email': {
    id: '33_Recibir_Email',
    penId: '33',
    title: 'Recibe tu diagnóstico por email',
    body: 'Te enviamos tu radar completo y un resumen de tus 12 habilidades.',
    orbVariant: 'diagnostic',
    illustrationKey: 'verify',
  },
  '34_Mapa_Cerebral': {
    id: '34_Mapa_Cerebral',
    penId: '34',
    title: '6 zonas, una mirada honesta',
    body: 'Cada zona agrupa 2 habilidades de tu diagnóstico',
    orbVariant: 'diagnostic',
    illustrationKey: 'result',
  },
  '35_Cierre_Onboarding': {
    id: '35_Cierre_Onboarding',
    penId: '35',
    title: 'Aquí empieza tu entrenamiento',
    body: 'Tu plan se adapta a ti: sesiones cortas, retos reales y feedback continuo.',
    orbVariant: 'default',
    illustrationKey: 'closure',
  },
  '31_Cierre': {
    id: '31_Cierre',
    penId: '31b',
    title: 'Tu plan te está esperando',
    body: 'Crea tu cuenta para guardar el diagnóstico y conectar con tus cursos recomendados.',
    orbVariant: 'default',
    illustrationKey: 'closure',
  },
};

/** @deprecated Mantenido por compatibilidad con `onboardingThinkingFrames` legacy. */
export const THINKING_FRAME_IDS = [
  '21_T_Reflexion_Q12',
  '24_T_Validando',
  '25_T_Analizando',
  '26_T_Procesando',
  '27_T_Fortalezas',
  '28_T_Perfil',
  '29_T_Loading_Entrenamiento',
] as const;

/** @deprecated Reemplazado por `progressLoaderFrames` en `data/onboardingFlow.ts`. */
export const THINKING_FRAMES: PenpotFrameMeta[] = [
  {
    id: '21_T_Reflexion_Q12',
    penId: '21',
    title: 'Reflexionando',
    body: 'Tu última respuesta nos ayuda a afinar el mapa de habilidades.',
    orbVariant: 'thinking',
    illustrationKey: 'thinking',
  },
  {
    id: '24_T_Validando',
    penId: '24',
    title: 'Validando',
    body: 'Comparamos tus respuestas con patrones de miles de perfiles.',
    orbVariant: 'thinking',
    illustrationKey: 'thinking',
  },
  {
    id: '25_T_Analizando',
    penId: '25',
    title: 'Analizando',
    body: 'Buscamos coherencia entre liderazgo, comunicación y adaptabilidad.',
    orbVariant: 'thinking',
    illustrationKey: 'thinking',
  },
  {
    id: '26_T_Procesando',
    penId: '26',
    title: 'Procesando respuestas',
    body: 'Cada punto del 1 al 5 aporta a tu perfil T2T.',
    orbVariant: 'thinking',
    illustrationKey: 'thinking',
  },
  {
    id: '27_T_Fortalezas',
    penId: '27',
    title: 'Detectando fortalezas',
    body: 'Identificamos dónde estás más sólido hoy.',
    orbVariant: 'thinking',
    illustrationKey: 'thinking',
  },
  {
    id: '28_T_Perfil',
    penId: '28',
    title: 'Construyendo tu perfil',
    body: 'Armamos tu ruta de entrenamiento personalizada.',
    orbVariant: 'thinking',
    illustrationKey: 'thinking',
  },
  {
    id: '29_T_Loading_Entrenamiento',
    penId: '29',
    title: 'Preparando tu plan',
    body: 'Últimos ajustes antes de mostrarte el resultado.',
    orbVariant: 'thinking',
    illustrationKey: 'thinking',
  },
];

export function getPenpotFrame(id: string): PenpotFrameMeta | undefined {
  return PENPOT_FRAMES[id] ?? THINKING_FRAMES.find((f) => f.id === id);
}

/** @deprecated Reemplazado por `carouselSlides` en `data/onboardingFlow.ts`. */
export const storyFrameIds = [
  '04_Impacto',
  '05_Identificacion',
  '06_Tension',
  '07_Diferencial',
  '08_Transformacion',
] as const;
