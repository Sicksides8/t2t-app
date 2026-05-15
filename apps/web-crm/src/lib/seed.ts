import type { Course, Plan } from '../types';

export const seedCourses: Course[] = [
  {
    id: 'liderazgo-1',
    title: 'Liderazgo humano para equipos modernos',
    skillId: 'liderazgo',
    description: 'Aprende a liderar con confianza, claridad y conversaciones dificiles bien llevadas.',
    totalLessons: 6,
    durationMin: 74,
    level: 'beginner',
    isActive: true,
    isPremium: false,
    order: 1,
  },
  {
    id: 'comunicacion-1',
    title: 'Comunicacion efectiva en situaciones tensas',
    skillId: 'comunicacion',
    description: 'Herramientas practicas para decir lo importante sin romper la relacion.',
    totalLessons: 5,
    durationMin: 58,
    level: 'intermediate',
    isActive: true,
    isPremium: true,
    order: 2,
  },
];

export const seedPlans: Plan[] = [
  { id: 'starter', name: 'Starter', price: 0, currency: 'ARS', durationDays: 14, features: ['Diagnostico completo', 'Curso inicial'], isActive: true },
  { id: 'academy', name: 'Academy', price: 9900, currency: 'ARS', durationDays: 30, features: ['Catalogo completo', 'Certificados', 'Desafios'], isActive: true },
];
