/**
 * Catalogo canonico de planes T2T.
 *
 * Espejo del catalogo en apps/mobile/src/services/subscriptionService.ts (CANONICAL_PLANS).
 * Mantener alineado: si cambian precios en la app movil hay que actualizarlos aqui
 * para que el calculo de MRR y LTV del CRM use los precios oficiales.
 *
 * TODO MERCADOPAGO: mover este catalogo a Firestore (t2t_plans) cuando los precios
 * necesiten editarse sin re-deploy.
 */

/**
 * Plan canónico T2T. `'elite'` reemplaza al anterior `'master'`; el término
 * "master" queda reservado para `CourseLevel` (dificultad del curso).
 */
export type CanonicalPlanId = 'free' | 'pro' | 'elite';

export interface CanonicalPlan {
  id: CanonicalPlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  trialDays: number;
  available: boolean;
}

export const CANONICAL_PLANS: CanonicalPlan[] = [
  {
    id: 'free',
    name: 'FREE',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    trialDays: 0,
    available: true,
  },
  {
    id: 'pro',
    name: 'PRO',
    priceMonthly: 9.9,
    priceYearly: 95.0,
    currency: 'USD',
    trialDays: 7,
    available: true,
  },
  {
    id: 'elite',
    name: 'ELITE',
    priceMonthly: 24.9,
    priceYearly: 239.0,
    currency: 'USD',
    trialDays: 7,
    available: true,
  },
];

const PLAN_INDEX: Record<string, CanonicalPlan> = Object.fromEntries(
  CANONICAL_PLANS.map((p) => [p.id, p]),
);

export function getCanonicalPlan(planId: string): CanonicalPlan | null {
  return PLAN_INDEX[planId] ?? null;
}

/**
 * Devuelve el precio mensualizado de un plan en una moneda. Para `yearly` divide /12.
 * Si el plan no existe (o es free) devuelve 0.
 */
export function monthlyPriceFor(planId: string, cycle: 'monthly' | 'yearly' = 'monthly'): number {
  const plan = getCanonicalPlan(planId);
  if (!plan || plan.id === 'free') return 0;
  return cycle === 'yearly' ? plan.priceYearly / 12 : plan.priceMonthly;
}
