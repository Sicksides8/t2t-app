/**
 * Prefijo de colecciones T2T en Firestore (proyecto compartido).
 * Mantener alineado con apps/mobile/src/constants/firestoreCollections.ts
 */
const P = 't2t_';

export const FS_COL = {
  users: `${P}users`,
  courses: `${P}courses`,
  skills: `${P}skills`,
  modules: `${P}modules`,
  lessons: `${P}lessons`,
  plans: `${P}plans`,
  enrollments: `${P}enrollments`,
  notifications: `${P}notifications`,
  diagnosticResults: `${P}diagnostic_results`,
  subscriptions: `${P}subscriptions`,
  subscriptionCodes: `${P}subscription_codes`,
  coinsTransactions: `${P}coins_transactions`,
  subscriptionRedemptions: `${P}subscription_redemptions`,
  achievements: `${P}achievements`,
  weeklyChallenges: `${P}weekly_challenges`,
  config: `${P}config`,
  waitlist: `${P}waitlist`,
  progress: `${P}progress`,
  progressCoursesSub: `${P}user_courses`,
} as const;
