/**
 * Cupones / promociones seed para Fase 1.
 *
 * En dev funcionan localmente sin Firestore (fallback del couponService).
 * En producción estos códigos deberían vivir en t2t_coupons/{CODE} (creados
 * desde el CRM). El seed permite probar el flujo end-to-end sin backend.
 */
import type { Coupon } from '../types';

export const seedCoupons: Coupon[] = [
  {
    code: 'T2T-LAUNCH-30D',
    kind: 'trial_extension',
    value: 30,
    extendsTrialDays: 30,
    isActive: true,
    description: '30 días extra de trial sobre PRO/ELITE.',
  },
  {
    code: 'T2T-PROMO-50',
    kind: 'percent',
    value: 50,
    isActive: true,
    description: '50% off el primer mes del plan elegido.',
  },
  {
    code: 'T2T-ELITE-FREE',
    kind: 'unlock_plan',
    value: 0,
    unlocksPlan: 'elite',
    isActive: true,
    description: 'Desbloquea ELITE por 30 días sin cargo.',
  },
];
