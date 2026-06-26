import type { Course, CourseModule, Lesson, Plan, Skill } from '../types';

// NOTA: courses / modules / lessons se cargan en tiempo real desde Firestore
// (poblados por el CRM admin). Sólo skills (taxonomía del catálogo) y plans
// (configuración de pricing) quedan como configuración estática.

/** Taxonomía alineada con las 11 dimensiones del diagnóstico T2T. */
export const skills: Skill[] = [
  { id: 'liderazgo', name: 'Liderazgo', description: 'Dirigir equipos con claridad humana.', icon: 'sparkles', color: '#B73CEF', order: 1 },
  { id: 'influencia', name: 'Influencia', description: 'Comunicar ideas que movilizan.', icon: 'megaphone', color: '#F472B6', order: 2 },
  { id: 'adaptabilidad', name: 'Adaptabilidad', description: 'Responder mejor al cambio.', icon: 'git-branch', color: '#25BFA5', order: 3 },
  { id: 'comunicacion', name: 'Comunicación', description: 'Expresar, escuchar y conectar.', icon: 'chatbubbles', color: '#FFB547', order: 4 },
  { id: 'equipo', name: 'Equipo', description: 'Colaborar y sumar en grupo.', icon: 'people', color: '#4CC35B', order: 5 },
  { id: 'resolucion', name: 'Resolución', description: 'Resolver problemas con claridad.', icon: 'bulb', color: '#FF8C42', order: 6 },
  { id: 'creatividad', name: 'Creatividad', description: 'Imaginar y probar caminos nuevos.', icon: 'color-palette', color: '#E879F9', order: 7 },
  { id: 'escucha', name: 'Escucha', description: 'Entender antes de responder.', icon: 'ear', color: '#38BDF8', order: 8 },
  { id: 'productividad', name: 'Productividad', description: 'Avanzar con foco y energía.', icon: 'timer', color: '#FF5C7A', order: 9 },
  { id: 'aprendizaje', name: 'Aprendizaje', description: 'Crecer con hábitos de estudio.', icon: 'book', color: '#A78BFA', order: 10 },
  { id: 'gestionEmocional', name: 'Gestión emocional', description: 'Regular emociones bajo presión.', icon: 'happy', color: '#34D399', order: 11 },
];

export const courses: Course[] = [];

export const modules: CourseModule[] = [];

export const lessons: Lesson[] = [];

export const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Open',
    price: 0,
    currency: 'ARS',
    durationDays: 14,
    features: ['Diagnóstico completo', 'Curso inicial', 'Progreso y coins'],
    isActive: true,
  },
  {
    id: 'academy',
    name: 'Pro',
    price: 9900,
    currency: 'ARS',
    durationDays: 30,
    features: ['Catálogo completo', 'Certificados', 'Desafíos semanales', 'Plan personalizado'],
    isActive: true,
  },
  {
    id: 'enterprise',
    name: 'Black',
    price: 0,
    currency: 'ARS',
    durationDays: 365,
    features: ['Equipos', 'Reportes', 'Soporte dedicado', 'Onboarding a medida'],
    isActive: true,
  },
];
