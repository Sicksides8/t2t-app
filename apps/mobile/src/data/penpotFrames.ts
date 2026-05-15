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
    title: 'Bienvenido a tu academia personal',
    body: 'Primero detectamos tu perfil. Luego conectamos cursos, progreso y plan de acción.',
    orbVariant: 'default',
    illustrationKey: 'welcome',
  },
  '03_Impacto': {
    id: '03_Impacto',
    penId: '03',
    title: 'Convierte habilidades humanas en ventaja real',
    body: 'T2T entrena las competencias que definen tu crecimiento profesional.',
    orbVariant: 'default',
    illustrationKey: 'story',
  },
  '04_Identificacion': {
    id: '04_Identificacion',
    penId: '04',
    title: 'Sabemos donde estás',
    body: 'Tu punto de partida importa. Por eso empezamos con un diagnóstico personal.',
    orbVariant: 'default',
    illustrationKey: 'story',
  },
  '05_Tension': {
    id: '05_Tension',
    penId: '05',
    title: 'El talento ya no alcanza',
    body: 'Comunicar, liderar y adaptarte es lo que acelera tus oportunidades.',
    orbVariant: 'default',
    illustrationKey: 'story',
  },
  '06_Diferencial': {
    id: '06_Diferencial',
    penId: '06',
    title: 'Un plan hecho para ti',
    body: 'La academia recomienda cursos según tus fortalezas y brechas.',
    orbVariant: 'default',
    illustrationKey: 'story',
  },
  '07_Transformacion': {
    id: '07_Transformacion',
    penId: '07',
    title: 'Aprende en pequeñas victorias',
    body: 'Lecciones cortas, progreso visible, coins, rachas y certificados.',
    orbVariant: 'default',
    illustrationKey: 'story',
  },
  '08_Accion': {
    id: '08_Accion',
    penId: '08',
    title: 'Empecemos el diagnóstico',
    body: 'Responde con honestidad. La app construirá tu mapa de entrenamiento.',
    orbVariant: 'default',
    illustrationKey: 'story',
  },
  '31_Cierre': {
    id: '31_Cierre',
    penId: '31',
    title: 'Tu plan te está esperando',
    body: 'Crea tu cuenta para guardar el diagnóstico y conectar con tus cursos recomendados.',
    orbVariant: 'default',
    illustrationKey: 'closure',
  },
  '32_SignUp': {
    id: '32_SignUp',
    penId: '32',
    title: 'Crea tu cuenta',
    body: 'Guardá tu diagnóstico y conectá tu plan personalizado.',
    orbVariant: 'auth',
    illustrationKey: 'auth',
  },
  '33_Login': {
    id: '33_Login',
    penId: '33',
    title: 'Bienvenido de nuevo',
    body: 'Continuá donde dejaste tu entrenamiento.',
    orbVariant: 'auth',
    illustrationKey: 'auth',
  },
  '34_Recuperar_Password': {
    id: '34_Recuperar_Password',
    penId: '34',
    title: 'Recuperá tu acceso',
    body: 'Te enviaremos instrucciones a tu email.',
    orbVariant: 'auth',
    illustrationKey: 'reset',
  },
  '35_Verificar_Email': {
    id: '35_Verificar_Email',
    penId: '35',
    title: 'Verificá tu email',
    body: 'Ingresá el código de 6 dígitos que enviamos a tu bandeja.',
    orbVariant: 'auth',
    illustrationKey: 'verify',
  },
};

export const THINKING_FRAME_IDS = [
  '21_T_Reflexion_Q12',
  '24_T_Validando',
  '25_T_Analizando',
  '26_T_Procesando',
  '27_T_Fortalezas',
  '28_T_Perfil',
  '29_T_Loading_Entrenamiento',
] as const;

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

export const storyFrameIds = [
  '03_Impacto',
  '04_Identificacion',
  '05_Tension',
  '06_Diferencial',
  '07_Transformacion',
  '08_Accion',
] as const;
