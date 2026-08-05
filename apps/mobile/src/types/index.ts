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

/**
 * Horizonte temporal del plan de entrenamiento que el usuario elige
 * en el onboarding (post-diagnóstico). Activa la versión personalizada
 * del frame `53_Plan_Personalizado`: título, packs y ruta de hitos
 * (día 1 / 1+N / checkpoint) se escalan según este valor.
 */
export type PlanHorizonDays = 30 | 60 | 90;

/** Nivel de experiencia elegido en onboarding pre-registro. */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface User {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  avatar?: string;
  /** Bio corta del alumno (editable en perfil). */
  bio?: string;
  role: UserRole;
  subscriptionId?: string;
  onboardingCompleted: boolean;
  diagnosticCompleted: boolean;
  /** Respuestas del HooksFlow post-registro: clave = id del paso (ej. 36_Hook_TipoUsuario). */
  hookSelections?: Record<string, string[]>;
  /**
   * Horizonte del plan de entrenamiento elegido en el onboarding (30/60/90 días).
   * Se setea en el step `46b_Hook_Horizonte` y consume el frame final
   * `53_Plan_Personalizado` para escalar título, packs y ruta de hitos.
   */
  planHorizonDays?: PlanHorizonDays;
  /**
   * Nivel de experiencia (principiante / intermedio / avanzado) elegido
   * en onboarding pre-registro.
   */
  experienceLevel?: ExperienceLevel;
  /**
   * Fecha en la que el usuario arrancó (o re-arrancó) su plan de entrenamiento.
   * Se setea junto con `planHorizonDays`. La home la usa para calcular
   * "Día X de N" en el banner del plan.
   */
  planStartedAt?: Date;
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
 *  - 'free'    -> clasificación base del catálogo.
 *  - 'lite'    -> contenido intermedio.
 *  - 'premium' -> contenido exclusivo.
 * La membresía requerida para verlo va en `requiredPlan` (independiente).
 * Si `requiredPlan` está ausente, se deriva de `accessTier` (legacy).
 */
export type CourseAccessTier = 'free' | 'lite' | 'premium';

/** Plan mínimo de suscripción para acceder al curso (free=Open, pro=Pro, elite=Black). */
export type CourseRequiredPlan = SubscriptionPlanId;

export interface Course {
  id: string;
  title: string;
  /** Categoría principal (slug canónico). */
  skillId: string;
  /** Tags secundarios de clasificación. */
  secondarySkillIds?: string[];
  /** Código de catálogo (C1, C2…). */
  courseCode?: string;
  description: string;
  thumbnail?: string;
  pdfUrl?: string;
  totalLessons: number;
  durationMin: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  isPremium?: boolean;
  /**
   * Clasificación del curso en el catálogo (CRM).
   */
  accessTier?: CourseAccessTier;
  /**
   * Suscripción mínima requerida. Fuente de verdad para gating cuando está presente.
   */
  requiredPlan?: CourseRequiredPlan;
  /** Orden en catálogo. */
  order?: number;
  /** Orden en plan Beta; null = no incluido. */
  planOrder?: number | null;
  /** Impacto gᵢ (0–1) por habilidad al completar el curso. */
  skillImpact?: Record<string, number>;
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
  skillImpactApplied?: boolean;
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
  /** Token de compra de Google Play (solo source === 'google'). */
  purchaseToken?: string;
  trialStartedAt?: Date;
  trialEndsAt?: Date;
  cancelledAt?: Date;
  /** Cupón aplicado al alta (si hubo). */
  couponCode?: string;
  /** Descuento aplicado en porcentaje (0-100). 0 si no hubo cupón. */
  discountPercent?: number;
}

/**
 * A qué planes aplica un código promocional creado desde el CRM.
 *  - 'pro' / 'elite': fuerza ese plan al canjear.
 *  - 'any_paid'    : el usuario elige (o se infiere de selectedPlan).
 */
export type SubscriptionCodeAppliesTo = 'pro' | 'elite' | 'any_paid';

/**
 * Código promocional (fuente de verdad: t2t_subscription_codes/{CODE}).
 *
 * Es la representación cliente del doc que crea el CRM en
 * apps/web-crm/src/app/api/admin/codes/route.ts. Single-use: el campo
 * `used` queda true tras el primer canje (con `usedBy` + `usedAt`).
 *
 * Reglas:
 *  - `discountPercent` entre 1 y 100. 100 ≡ acceso gratis por `durationDays`.
 *  - `expiresAt` null/undefined = no expira.
 *  - `appliesTo` decide el plan al que se aplica.
 */
export interface SubscriptionCode {
  code: string;
  title?: string;
  discountPercent: number;
  appliesTo: SubscriptionCodeAppliesTo;
  durationDays: number;
  expiresAt?: Date;
  used: boolean;
  usedBy?: string;
  usedAt?: Date;
}

export interface DiagnosticResult {
  userId?: string;
  answers: Record<string, number>;
  scores: Record<string, number>;
  baseScores?: Record<string, number>;
  focusAreas?: string[];
  topSkills: string[];
  weakSkills: string[];
  /** Promedio de habilidades en escala 2–10 (visible al usuario). */
  overallScore210?: number;
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
  DiagnosticRetake: undefined;
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
