import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type HookIconOption = {
  id: string;
  label: string;
  subtitle?: string;
  icon: IoniconName;
  tileColor?: string;
  iconColor?: string;
};

export type HookChip = {
  id: string;
  label: string;
};

export type HookTestimonial = {
  initials?: string;
  name: string;
  role?: string;
  quote: string;
  avatarColor?: string;
  avatarUrl?: string;
};

export type HookPricingPlan = {
  id: 'free' | 'pro' | 'elite';
  name: string;
  pitch: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  highlight?: 'mostPopular' | 'comingSoon';
  variant: 'free' | 'pro' | 'elite';
};

export type HookPlanReadyContent = {
  scriptLine: string;
  headline: string;
  caption?: string;
  ribbonLabel?: string;
};

export type HookPersonalizedPack = {
  id: string;
  title: string;
  daysLabel: string;
  icon: IoniconName;
  variant: 'lider' | 'startup' | 'productividad';
};

export type HookRouteItem = {
  id: string;
  day: number;
  title: string;
  caption: string;
  variant: 'green' | 'magenta' | 'teal';
  icon: IoniconName;
  /** Si true, el círculo se rellena con el color del variant (estado "hoy"). */
  solid?: boolean;
};

type Counted = { counted: true };
type NotCounted = { counted: false };

type StepBase = { id: string; penId: string };

export type HookStep =
  | (StepBase & Counted & {
      kind: 'iconSelect';
      title: string;
      subtitle?: string;
      multiSelect: boolean;
      options: HookIconOption[];
    })
  | (StepBase & Counted & {
      kind: 'chipSelect';
      title: string;
      subtitle?: string;
      chipMain: HookChip;
      chips: HookChip[];
      multiSelect: true;
    })
  | (StepBase & NotCounted & {
      kind: 'badge';
      headline: string;
      subtitle: string;
      badgeName: string;
      badgeReason: string;
      ctaLabel?: string;
    })
  | (StepBase & Counted & {
      kind: 'interstitial';
      title: string;
      body: string;
      icon: IoniconName;
    })
  | (StepBase & Counted & {
      kind: 'progressWithQuestion';
      title: string;
      subtitle?: string;
      tasks: string[];
      question: { preScript: string; text: string; yesLabel?: string; noLabel?: string };
    })
  | (StepBase & Counted & {
      kind: 'socialProof';
      title: string;
      tasks: string[];
      statHeadline: string;
      testimonial: HookTestimonial;
    })
  | (StepBase & NotCounted & {
      kind: 'planReady';
      content: HookPlanReadyContent;
      ctaLabel: string;
    })
  | (StepBase & Counted & {
      kind: 'pricing';
      title: string;
      plans: HookPricingPlan[];
      stats: { value: string; label: string }[];
      defaultPeriod: 'monthly' | 'yearly';
      ctaLabel: string;
      footnote: string;
    })
  | (StepBase & Counted & {
      kind: 'ageSelect';
      title: string;
      subtitle?: string;
      ranges: string[];
    })
  | (StepBase & Counted & {
      kind: 'nameInput';
      title: string;
      preScript: string;
      placeholder: string;
      caption: string;
    })
  | (StepBase & Counted & {
      kind: 'confirmPlan';
      title: string;
      planLabel: string;
      trialDays: number;
      trialCaption: string;
      afterPricing: string;
      redeemCtaLabel: string;
      appleCtaLabel: string;
      googleCtaLabel: string;
      footnote: string;
    })
  | (StepBase & NotCounted & {
      kind: 'redeemCode';
      title: string;
      subtitle: string;
      placeholder: string;
      infoBody: string;
      ctaLabel: string;
    })
  | (StepBase & NotCounted & {
      kind: 'codeApplied';
      content: HookPlanReadyContent;
      ctaLabel: string;
    })
  | (StepBase & NotCounted & {
      kind: 'personalizedPlan';
      title: string;
      coachName: string;
      coachInitials: string;
      coachRole: string;
      scriptLine: string;
      bodyLine: string;
      packsTitle: string;
      packs: HookPersonalizedPack[];
      routeTitle: string;
      route: HookRouteItem[];
      ctaLabel: string;
    })
  | (StepBase & NotCounted & {
      kind: 'welcomeVideo';
      title: string;
      durationLabel: string;
      scriptLine: string;
      headline: string;
      authorName: string;
      authorRole: string;
      videoUrl?: string;
      ctaLabel: string;
      skipLabel: string;
    })
  | (StepBase & NotCounted & {
      kind: 'specialOffer';
      discountLabel: string;
      headline: string;
      subtitle: string;
      pricePitch: string;
      priceMain: string;
      priceFootnote: string;
      durationMs: number;
      ctaLabel: string;
      restoreLabel: string;
    });

export const hooksFlowSteps: HookStep[] = [
  // STEP 1 — TipoUsuario (counted)
  {
    id: '40_Hook_TipoUsuario',
    penId: '40',
    kind: 'iconSelect',
    counted: true,
    title: '¿Cuál te describe?',
    subtitle: 'Seleccioná todas las que apliquen',
    multiSelect: true,
    options: [
      {
        id: 'estudiante',
        label: 'Estudiante',
        subtitle: 'Aprendo formalmente',
        icon: 'school-outline',
        tileColor: '#FFFFFF14',
        iconColor: '#FFFFFF',
      },
      {
        id: 'profesional',
        label: 'Joven profesional',
        subtitle: 'Trabajo en una empresa',
        icon: 'briefcase-outline',
        tileColor: '#B73CEF',
        iconColor: '#FFFFFF',
      },
      {
        id: 'humano',
        label: 'Humano curioso',
        subtitle: 'Quiero crecer en habilidades blandas',
        icon: 'sparkles-outline',
        tileColor: '#FFFFFF14',
        iconColor: '#FFFFFF',
      },
    ],
  },

  // STEP 2 — Objetivos (counted)
  {
    id: '41_Hook_Objetivos',
    penId: '41',
    kind: 'chipSelect',
    counted: true,
    title: '¿Qué querés lograr?',
    subtitle: 'Elegí todas las que apliquen',
    multiSelect: true,
    chipMain: { id: 'exito', label: 'Éxito Profesional' },
    chips: [
      { id: 'liderazgo', label: 'Liderazgo' },
      { id: 'comunicacion', label: 'Comunicación' },
      { id: 'productividad', label: 'Productividad' },
      { id: 'creatividad', label: 'Creatividad' },
      { id: 'foco', label: 'Foco mental' },
      { id: 'gestion', label: 'Gestión del tiempo' },
    ],
  },

  // Transition — Insignia (NOT counted)
  {
    id: '42_Hook_Insignia',
    penId: '42',
    kind: 'badge',
    counted: false,
    headline: '¡Así se hace!',
    subtitle: 'Acabas de conseguir la insignia',
    badgeName: 'EMPEZAR CON FUERZA',
    badgeReason: 'por establecer objetivos ambiciosos',
    ctaLabel: 'Continuar',
  },

  // STEP 3 — TiempoSemanal (counted)
  {
    id: '43_Hook_TiempoSemanal',
    penId: '43',
    kind: 'iconSelect',
    counted: true,
    title: '¿Cuánto tiempo tenés por semana?',
    subtitle: 'Adaptamos tu plan a tu disponibilidad',
    multiSelect: false,
    options: [
      {
        id: '15min',
        label: '15 minutos',
        subtitle: 'Rapidito, dos sesiones cortas',
        icon: 'flash-outline',
        tileColor: '#FF5C7A',
        iconColor: '#FFFFFF',
      },
      {
        id: '30min',
        label: '30 minutos',
        subtitle: 'Balance entre práctica y reflexión',
        icon: 'time-outline',
        tileColor: '#FFB547',
        iconColor: '#1A0030',
      },
      {
        id: '45min',
        label: '45+ minutos',
        subtitle: 'Sumergite a fondo cada día',
        icon: 'rocket-outline',
        tileColor: '#4CC35B',
        iconColor: '#1A0030',
      },
    ],
  },

  // STEP 4 — Interstitial_A (counted)
  {
    id: '44_Hook_Interstitial_A',
    penId: '44',
    kind: 'interstitial',
    counted: true,
    title: 'Estás en el lugar adecuado',
    body: 'Tus respuestas nos ayudan a crear un plan paso a paso para que alcances tus metas.',
    icon: 'trending-up',
  },

  // STEP 5 — GenerandoPlan + Sí/No (counted)
  {
    id: '45_Hook_GenerandoPlan',
    penId: '45',
    kind: 'progressWithQuestion',
    counted: true,
    title: 'Estamos diseñando tu plan…',
    subtitle: 'Tus respuestas alimentan el motor',
    tasks: ['Analizando objetivos', 'Ajustando tu perfil', 'Seleccionando contenido'],
    question: {
      preScript: 'Para mejorar las recomendaciones, especifica:',
      text: '¿Creés que la práctica es clave para dominar nuevas habilidades?',
      yesLabel: 'Sí',
      noLabel: 'No',
    },
  },

  // STEP 6 — SocialProof (counted)
  {
    id: '46_Hook_IASocialProof',
    penId: '46',
    kind: 'socialProof',
    counted: true,
    title: '¡Ya casi estamos!',
    tasks: ['Analizando tus objetivos', 'Creando perfil mental', 'Creando tu programa'],
    statHeadline: 'Miles de personas ya entrenan su mente con T2T',
    testimonial: {
      name: 'Lorena Castillo',
      role: 'Líder de compras · Dunlop Argentina',
      initials: 'LC',
      quote: 'En dos semanas noté cambios en cómo comunico con mi equipo.',
      avatarColor: '#B73CEF',
    },
  },

  // Transition — Plan Listo (NOT counted)
  {
    id: '47_Plan_Listo',
    penId: '47',
    kind: 'planReady',
    counted: false,
    content: {
      scriptLine: '¡Listo!',
      headline: 'Ya tenemos tu plan',
      caption: 'Personalizado según tu diagnóstico',
      ribbonLabel: 'Plan listo',
    },
    ctaLabel: 'Ver mi plan',
  },

  // STEP 7 — Pricing (counted, header dedicado)
  {
    id: '51_Onboarding_Plan',
    penId: '51',
    kind: 'pricing',
    counted: true,
    title: 'Planes',
    stats: [
      { value: '40+', label: 'habilidades' },
      { value: '+10', label: 'instructores' },
      { value: '120', label: 'módulos' },
    ],
    defaultPeriod: 'monthly',
    plans: [
      {
        id: 'pro',
        name: 'PRO',
        pitch: 'Catálogo completo',
        priceMonthly: 9.9,
        priceYearly: 95.0,
        currency: 'USD',
        highlight: 'mostPopular',
        variant: 'pro',
      },
      {
        id: 'free',
        name: 'FREE',
        pitch: '3 módulos por habilidad',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'USD',
        variant: 'free',
      },
      {
        id: 'elite',
        name: 'ELITE',
        pitch: 'PRO + sesiones 1:1',
        priceMonthly: 24.9,
        priceYearly: 239.0,
        currency: 'USD',
        highlight: 'comingSoon',
        variant: 'elite',
      },
    ],
    ctaLabel: 'Probar 7 días gratis',
    footnote: 'Sin tarjeta. Cancelás cuando quieras.',
  },

  // STEP 8 — Edad (counted)
  {
    id: '48_Hook_Edad',
    penId: '48',
    kind: 'ageSelect',
    counted: true,
    title: '¿Cuál es tu rango de edad?',
    subtitle: 'Personaliza tu experiencia',
    ranges: ['18-24', '25-34', '35-44', '45-54', '+55'],
  },

  // STEP 9 — Nombre (counted)
  {
    id: '49_Hook_Nombre',
    penId: '49',
    kind: 'nameInput',
    counted: true,
    title: '¿Cómo te gustaría que te llamemos?',
    preScript: '¡Comencemos!',
    placeholder: 'Tu nombre',
    caption: 'Puedes cambiarlo después en tu perfil',
  },

  // STEP 10 — Confirmar Plan (counted, header dedicado)
  {
    id: '52_Confirmar_Plan',
    penId: '52',
    kind: 'confirmPlan',
    counted: true,
    title: 'Confirmar plan',
    planLabel: 'PLAN PRO',
    trialDays: 7,
    trialCaption: 'gratis · sin cargo',
    afterPricing: 'Después: USD 9.90 / mes. Cancelás cuando quieras.',
    redeemCtaLabel: '¿Tenés un código? Canjéalo',
    appleCtaLabel: 'Continuar con Apple',
    googleCtaLabel: 'Continuar con Google',
    footnote: 'No se te cobrará durante el trial.',
  },

  // Branch — Canjear código (NOT counted)
  {
    id: '54_Canjear_Codigo',
    penId: '54',
    kind: 'redeemCode',
    counted: false,
    title: 'Canjeá tu código',
    subtitle: 'Activá tu beneficio en segundos',
    placeholder: 'XXXX - XXXX',
    infoBody:
      'Activa ELITE 2 meses. Te pediremos tarjeta como respaldo, sin cobros durante ese período.',
    ctaLabel: 'Canjear y activar',
  },

  // Branch — Código aplicado (NOT counted)
  {
    id: '55_Codigo_Aplicado',
    penId: '55',
    kind: 'codeApplied',
    counted: false,
    content: {
      scriptLine: '¡Bienvenido!',
      headline: 'Tu plan ELITE está activo',
      caption: 'Hasta el 22 de junio · sin cobros',
      ribbonLabel: 'Código aplicado',
    },
    ctaLabel: 'Empezar a aprender',
  },

  // Modal — Oferta Especial (NOT counted)
  {
    id: '50_Oferta_Especial',
    penId: '50',
    kind: 'specialOffer',
    counted: false,
    discountLabel: '25% OFF',
    headline: 'Oferta por única vez',
    subtitle: 'Solo para los próximos 15 minutos',
    pricePitch: 'Entrenamientos personalizados por solo',
    priceMain: 'USD 2,15 /mes',
    priceFootnote: 'Facturado anualmente en USD 25.90',
    durationMs: 15 * 60 * 1000,
    ctaLabel: 'Continuar con descuento',
    restoreLabel: 'Restaurar compras',
  },

  // FINAL — Plan personalizado (NOT counted)
  {
    id: '53_Plan_Personalizado',
    penId: '53',
    kind: 'personalizedPlan',
    counted: false,
    title: 'Tu plan · 60 días',
    coachName: 'Gustavo Rodríguez',
    coachInitials: 'GR',
    coachRole: 'Director de T2T Academy',
    scriptLine: 'Hagámoslo juntos',
    bodyLine: '60 días con Gustavo Rodríguez',
    packsTitle: 'Packs especiales',
    packs: [
      {
        id: 'lider',
        title: 'Quiero ser líder',
        daysLabel: '30 días',
        icon: 'ribbon-outline',
        variant: 'lider',
      },
      {
        id: 'startup',
        title: 'Brilliant Startup',
        daysLabel: '28 días',
        icon: 'rocket-outline',
        variant: 'startup',
      },
    ],
    routeTitle: 'Tu ruta',
    route: [
      {
        id: 'r1',
        day: 1,
        title: 'Tu radar de hoy · Liderazgo',
        caption: '10 min · módulo introductorio',
        variant: 'green',
        icon: 'play',
        solid: true,
      },
      {
        id: 'r7',
        day: 7,
        title: 'Comunicación efectiva',
        caption: '15 min · 2 módulos',
        variant: 'teal',
        icon: 'chatbubble-outline',
      },
      {
        id: 'r15',
        day: 15,
        title: 'Resolución de problemas',
        caption: '20 min · 3 módulos',
        variant: 'teal',
        icon: 'bulb-outline',
      },
      {
        id: 'r30',
        day: 30,
        title: 'Checkpoint · Repite tu radar',
        caption: '5 min · ver tu progreso',
        variant: 'magenta',
        icon: 'refresh',
      },
    ],
    ctaLabel: 'Empezar mi plan',
  },

  // FINAL — Welcome Video del autor (NOT counted)
  {
    id: '56_Welcome_Video_Autor',
    penId: '56',
    kind: 'welcomeVideo',
    counted: false,
    title: 'Bienvenida',
    durationLabel: 'BIENVENIDA · 1:24',
    scriptLine: 'Hagámoslo juntos',
    headline: 'Bienvenido a tu gimnasio',
    authorName: 'Gustavo Rodríguez',
    authorRole: 'Director de T2T Academy',
    ctaLabel: 'Ir al inicio',
    skipLabel: 'Omitir',
  },
];

export function hookStepRequiresSelection(step: HookStep): boolean {
  return (
    step.kind === 'iconSelect' ||
    step.kind === 'chipSelect' ||
    step.kind === 'ageSelect' ||
    step.kind === 'nameInput'
  );
}

export function countedSteps(steps: HookStep[] = hooksFlowSteps): HookStep[] {
  return steps.filter((s) => s.counted);
}

export function isOptionalStep(step: HookStep): boolean {
  // Steps allowed to skip without persisting a selection
  return (
    step.kind === 'iconSelect' ||
    step.kind === 'chipSelect' ||
    step.kind === 'ageSelect' ||
    step.kind === 'nameInput'
  );
}

export function findStepIndexById(id: string, steps: HookStep[] = hooksFlowSteps): number {
  return steps.findIndex((s) => s.id === id);
}
