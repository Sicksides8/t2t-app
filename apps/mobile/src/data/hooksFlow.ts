import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type HookStep =
  | {
      id: string;
      penId: string;
      kind: 'select';
      title: string;
      subtitle?: string;
      options: { id: string; label: string; icon?: IoniconName }[];
      multiSelect: boolean;
    }
  | {
      id: string;
      penId: string;
      kind: 'badge';
      headline: string;
      subtitle: string;
      badgeName: string;
      badgeReason: string;
    }
  | {
      id: string;
      penId: string;
      kind: 'interstitial';
      title: string;
      body: string;
      icon: IoniconName;
      iconTint?: 'primary' | 'secondary';
    }
  | {
      id: string;
      penId: string;
      kind: 'progress';
      title: string;
      subtitle?: string;
      tasks: string[];
      autoAdvanceMs?: number;
    }
  | {
      id: string;
      penId: string;
      kind: 'socialProof';
      title: string;
      tasks: string[];
      statHeadline: string;
      testimonial: { initials: string; name: string; quote: string };
      autoAdvanceMs?: number;
    }
  | {
      id: string;
      penId: string;
      kind: 'promo';
      title: string;
      subtitle: string;
    }
  | {
      id: string;
      penId: string;
      kind: 'welcomeVideo';
      title: string;
      durationLabel: string;
      scriptLine: string;
      headline: string;
      authorName: string;
      authorRole: string;
      videoUrl?: string;
    }
  | {
      id: string;
      penId: string;
      kind: 'planSelect';
      title: string;
      subtitle?: string;
      planIds: string[];
    }
  | {
      id: string;
      penId: string;
      kind: 'closure';
      title: string;
      body: string;
      summarySkillsLabel?: string;
    };

/** Post-login hooks + plan (Penpot 36–51). Solo `select` y `planSelect` requieren elección del usuario. */
export const hooksFlowSteps: HookStep[] = [
  {
    id: '36_Hook_TipoUsuario',
    penId: '36',
    kind: 'select',
    title: '¿Cuál te describe?',
    subtitle: 'Seleccioná todas las que apliquen',
    multiSelect: true,
    options: [
      { id: 'estudiante', label: 'Estudiante', icon: 'school-outline' },
      { id: 'profesional', label: 'Profesional', icon: 'briefcase-outline' },
      { id: 'emprendedor', label: 'Emprendedor', icon: 'rocket-outline' },
      { id: 'lider', label: 'Líder de equipo', icon: 'people-outline' },
    ],
  },
  {
    id: '37_Hook_Objetivos',
    penId: '37',
    kind: 'select',
    title: '¿Qué querés lograr con T2T?',
    subtitle: 'Elegí tus objetivos principales',
    multiSelect: true,
    options: [
      { id: 'trabajo', label: 'Mejorar en el trabajo', icon: 'trending-up-outline' },
      { id: 'confianza', label: 'Subir mi confianza', icon: 'shield-checkmark-outline' },
      { id: 'habitos', label: 'Aprender hábitos', icon: 'repeat-outline' },
      { id: 'certificar', label: 'Certificar habilidades', icon: 'ribbon-outline' },
    ],
  },
  {
    id: '38_Hook_Insignia',
    penId: '38',
    kind: 'badge',
    headline: '¡Así se hace!',
    subtitle: 'Acabas de conseguir la insignia',
    badgeName: 'EMPEZAR CON FUERZA',
    badgeReason: 'por establecer objetivos ambiciosos',
  },
  {
    id: '39_Hook_Interstitial_A',
    penId: '39',
    kind: 'interstitial',
    title: 'Estás en el lugar adecuado para convertirte en tu mejor versión',
    body: 'Tus respuestas nos ayudarán a crear un plan personalizado, paso a paso, para que alcances tus metas.',
    icon: 'trending-up',
    iconTint: 'primary',
  },
  {
    id: '40_Hook_Interstitial_B',
    penId: '40',
    kind: 'interstitial',
    title: 'Ya sabés lo que querés, así que vamos a hacerlo realidad',
    body: 'Respondé unas cuantas preguntas más para adaptar tu aventura a tus necesidades.',
    icon: 'sparkles',
    iconTint: 'secondary',
  },
  {
    id: '41_Hook_GenerandoPlan',
    penId: '41',
    kind: 'progress',
    title: 'Estamos diseñando tu aventura a medida…',
    subtitle: 'Tus respuestas alimentan el motor',
    tasks: ['Analizando objetivos', 'Ajustando tu perfil', 'Seleccionando cursos'],
    autoAdvanceMs: 3200,
  },
  {
    id: '42_Hook_IASocialProof',
    penId: '42',
    kind: 'socialProof',
    title: '¡Ya casi estamos! Nuestra IA está creando tu plan de entrenamiento mental',
    tasks: ['Analizando tus objetivos…', 'Creando perfil mental…', 'Creando tu programa…'],
    statHeadline: '100.000+ usuarios confían en T2T',
    testimonial: {
      initials: 'MR',
      name: 'María R.',
      quote: 'En dos semanas noté cambios en cómo comunico con mi equipo.',
    },
    autoAdvanceMs: 4000,
  },
  {
    id: '43_Hook_Edad',
    penId: '43',
    kind: 'select',
    title: '¿Cuál es tu rango de edad?',
    subtitle: 'Personaliza tu experiencia',
    multiSelect: false,
    options: [
      { id: '18-24', label: '18-24' },
      { id: '25-34', label: '25-34' },
      { id: '35-44', label: '35-44' },
      { id: '45+', label: '45+' },
    ],
  },
  {
    id: '44_Hook_Genero',
    penId: '44',
    kind: 'select',
    title: '¿Cómo querés personalizar la experiencia?',
    multiSelect: false,
    options: [
      { id: 'femenino', label: 'Femenino' },
      { id: 'masculino', label: 'Masculino' },
      { id: 'omitir', label: 'Prefiero no decir' },
    ],
  },
  {
    id: '45_Hook_Nombre',
    penId: '45',
    kind: 'interstitial',
    title: '¡Listo, {name}!',
    body: 'Tu academia personal está configurada. El siguiente paso es elegir cómo querés entrenar.',
    icon: 'hand-right-outline',
    iconTint: 'primary',
  },
  {
    id: '46_Onboarding_Plan',
    penId: '46',
    kind: 'planSelect',
    title: 'Elegí tu plan',
    subtitle: 'Podés cambiarlo más adelante',
    planIds: [], // se resuelve en runtime con plans del seed
  },
  {
    id: '47_Confirmar_Plan',
    penId: '47',
    kind: 'interstitial',
    title: 'Excelente elección',
    body: 'Con tu plan tenés acceso a cursos, progreso gamificado y certificados.',
    icon: 'checkmark-circle',
    iconTint: 'secondary',
  },
  {
    id: '48_Plan_Personalizado',
    penId: '48',
    kind: 'interstitial',
    title: 'Tu plan recomendado está listo',
    body: 'Priorizamos liderazgo, comunicación y productividad según tu diagnóstico.',
    icon: 'map-outline',
    iconTint: 'primary',
  },
  {
    id: '49_Canjear_Codigo',
    penId: '49',
    kind: 'promo',
    title: '¿Tenés un código promocional?',
    subtitle: 'Opcional — podés saltarlo',
  },
  {
    id: '50_Codigo_Aplicado',
    penId: '50',
    kind: 'interstitial',
    title: '¡Beneficio activado!',
    body: 'Tu código se aplicó correctamente. Disfrutá el acceso extendido.',
    icon: 'gift-outline',
    iconTint: 'secondary',
  },
  {
    id: '31_Cierre_Onboarding',
    penId: '31',
    kind: 'closure',
    title: 'Tu academia está lista',
    body: 'Armamos tu ruta según el diagnóstico. Estos son los ejes donde más vas a entrenar primero.',
    summarySkillsLabel: 'Tus focos de entrenamiento',
  },
  {
    id: '51_Welcome_Video_Autor',
    penId: '51',
    kind: 'welcomeVideo',
    title: 'Un mensaje para empezar',
    durationLabel: 'BIENVENIDA · 1:24',
    scriptLine: 'Hagámoslo juntos',
    headline: 'Bienvenido a tu gimnasio',
    authorName: 'Gustavo Rodríguez',
    authorRole: 'Director de T2T Academy',
  },
];

export function hookStepRequiresSelection(step: HookStep): boolean {
  return step.kind === 'select' || step.kind === 'planSelect';
}
