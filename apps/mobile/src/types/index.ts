import type { NavigatorScreenParams } from '@react-navigation/native';

export type UserRole = 'student' | 'admin' | 'none';

/**
 * Dominio canónico de planes de suscripción.
 * Nota: `'elite'` es el plan top (antes llamado 'master'). El término
 * "master" queda reservado para `CourseLevel` (dificultad del curso).
 */
export type SubscriptionPlanId = 'free' | 'pro' | 'elite';

/** Estado de la suscripción del usuario. */
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'cancelled' | 'expired';

/** Origen del alta (qué pasarela/medio creó la suscripción). */
export type SubscriptionSource = 'apple' | 'google' | 'mercadopago' | 'code' | 'mock';

/** Ciclo de facturación. La UI ya muestra anual con descuento, pero en Fase 1 sólo se persiste 'monthly'. */
export type BillingCycle = 'monthly' | 'yearly';

export interface User {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  subscriptionId?: string;
  onboardingCompleted: boolean;
  diagnosticCompleted: boolean;
  /** Respuestas del HooksFlow post-registro: clave = id del paso (ej. 36_Hook_TipoUsuario). */
  hookSelections?: Record<string, string[]>;
  selectedPlan?: string;
  /** Espejo del plan canónico del Subscription doc (free|pro|elite). */
  subscriptionPlan?: SubscriptionPlanId;
  /** Espejo del estado actual de la suscripción. */
  subscriptionStatus?: SubscriptionStatus;
  /** Origen del alta — referencia para soporte y métricas. */
  subscriptionSource?: SubscriptionSource;
  /** Inicio del trial de 7 días (si aplica). */
  trialStartedAt?: Date;
  /** Fin del trial (si aplica). El watcher cliente compara contra now(). */
  trialEndsAt?: Date;
  /** Próxima fecha de renovación (mensual = +30 días). */
  subscriptionRenewsAt?: Date;
  /** Cuándo se canceló la suscripción (mantiene acceso hasta subscriptionRenewsAt). */
  subscriptionCancelledAt?: Date;
  /** Último cupón aplicado al user (para mostrarlo en perfil / no permitir reaplicarlo). */
  appliedCouponCode?: string;
  coins?: number;
  level?: number;
  savedCourseIds?: string[];
  /** Días consecutivos activos (Duolingo-like). */
  currentStreak?: number;
  /** Récord histórico de racha. */
  longestStreak?: number;
  /** Último día activo en formato 'YYYY-MM-DD' (TZ local del dispositivo). */
  lastActiveDay?: string;
  /** Escudos de racha disponibles esta semana (se regenera 1/sem). */
  streakFreezesAvailable?: number;
  /** 'YYYY-Www' usado para resetear los freezes cada semana. */
  streakFreezeWeekKey?: string;
  /** Hitos de racha ya premiados (3, 7, 14, 30...) para idempotencia local. */
  streakMilestonesAwarded?: number[];
  notificationTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

/**
 * Tier de acceso del curso (escrito por el CRM en t2t_courses.accessTier).
 *  - 'free'    -> abierto a cualquier usuario.
 *  - 'lite'    -> requiere plan PRO o superior.
 *  - 'premium' -> requiere plan ELITE.
 * Si está ausente, se respeta el flag legacy isPremium (true ≡ lite).
 */
export type CourseAccessTier = 'free' | 'lite' | 'premium';

export interface Course {
  id: string;
  title: string;
  skillId: string;
  description: string;
  thumbnail?: string;
  pdfUrl?: string;
  totalLessons: number;
  durationMin: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  isPremium?: boolean;
  /**
   * Granularidad opcional cuando el CRM la define. Si está presente,
   * `getRequiredPlan` la usa como fuente de verdad por sobre `isPremium`.
   */
  accessTier?: CourseAccessTier;
  order?: number;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
  totalLessons: number;
}

export interface ModuleLink {
  label?: string;
  url: string;
}

export interface SubtitleTrack {
  /** ISO 639-1 (es, en, pt, ...). */
  lang: string;
  /** Etiqueta legible para mostrar en el reproductor (ej. "Español", "English"). */
  label: string;
  /** URL pública del archivo .vtt (R2). */
  url: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  videoUrl: string;
  pdfUrl?: string;
  links?: ModuleLink[];
  subtitles?: SubtitleTrack[];
  durationSec: number;
  order: number;
  isFree: boolean;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface CourseProgress {
  courseId: string;
  currentLessonId?: string;
  lessonsCompleted: string[];
  percentComplete: number;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  cycle: BillingCycle;
  startDate: Date;
  /** Próxima renovación (o fin del trial si status === 'trialing'). */
  endDate: Date;
  trialStartedAt?: Date;
  trialEndsAt?: Date;
  cancelledAt?: Date;
  /** Cupón aplicado al alta (si hubo). */
  couponCode?: string;
  /** Descuento aplicado en porcentaje (0-100). 0 si no hubo cupón. */
  discountPercent?: number;
}

/**
 * Cupón / código promocional.
 * - 'percent': descuento porcentual al precio.
 * - 'amount': descuento por monto fijo.
 * - 'trial_extension': suma días al trial (extendsTrialDays).
 * - 'unlock_plan': desbloquea un plan determinado por X días sin cobro (unlocksPlan).
 */
export interface Coupon {
  code: string;
  kind: 'percent' | 'amount' | 'trial_extension' | 'unlock_plan';
  value: number;
  unlocksPlan?: SubscriptionPlanId;
  extendsTrialDays?: number;
  validUntil?: Date;
  maxRedemptions?: number;
  redemptionsCount?: number;
  isActive: boolean;
  description?: string;
}

export interface DiagnosticResult {
  userId?: string;
  answers: Record<string, number>;
  scores: Record<string, number>;
  baseScores?: Record<string, number>;
  focusAreas?: string[];
  topSkills: string[];
  weakSkills: string[];
  completedAt?: Date;
}

export type NotificationType = 'streak' | 'achievement' | 'lesson' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  plan: SubscriptionPlanId;
  planLabel: string;
  amount: number;
  currency: string;
  method: 'Apple IAP' | 'Apple Pay' | 'Google Play' | 'Stripe' | 'MercadoPago' | 'Mock';
  txId: string;
  paidAt: Date;
  status: 'paid' | 'refunded' | 'pending';
  cycle?: BillingCycle;
  couponCode?: string;
}

export interface Achievement {
  id: string;
  userId: string;
  type: 'certificate' | 'streak' | 'coins' | 'course_completed';
  title: string;
  description?: string;
  earnedAt: Date;
  courseId?: string;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'spent';
  reason: string;
  createdAt: Date;
}

export type RootStackParamList = {
  Bootstrap: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Hooks: undefined;
  Main: undefined;
  CourseDetail: { courseId: string };
  SkillCatalog: { skillId: string; skillName?: string };
  VideoPlayer: { courseId: string; lessonId?: string };
  CertificateDetail: { certificateId: string; courseId?: string };
};

export type AuthStackParamList = {
  SignUp: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  VerifyEmail: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  RedeemCode: undefined;
  Subscription: undefined;
  PaymentDetail: { paymentId: string };
  DiagnosticApp: undefined;
  Certificates: undefined;
  CertificateDetail: { certificateId: string; courseId?: string };
  Progress: undefined;
  CoinsHistory: undefined;
  WeeklyChallenge: undefined;
  NotificationsList: undefined;
  SystemStates: undefined;
  Offline: undefined;
  ErrorState: undefined;
  Maintenance: undefined;
  EmptyBoard: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  MyCoursesTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
