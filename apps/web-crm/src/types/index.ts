export type UserRole = 'student' | 'admin' | 'none';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  subscriptionId?: string;
  onboardingCompleted: boolean;
  diagnosticCompleted: boolean;
  hookSelections?: Record<string, string[]>;
  notificationTokens: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'master' | 'expert';
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
  level: CourseLevel;
  accessTier?: CourseAccessTier;
  isActive: boolean;
  isPremium?: boolean;
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

export type LessonDraft = Omit<Lesson, 'id' | 'courseId' | 'moduleId'> & {
  clientId: string;
  id?: string;
};

export interface CourseDetailPayload {
  course: Course;
  modules: CourseModule[];
  lessons: Lesson[];
}

export type CreateCourseBody = {
  title: string;
  skillId: string;
  description: string;
  thumbnail?: string;
  pdfUrl?: string;
  level: CourseLevel;
  accessTier?: CourseAccessTier;
  isActive?: boolean;
  isPremium?: boolean;
  order?: number;
  moduleTitle?: string;
  lessons: Array<{
    title: string;
    videoUrl?: string;
    pdfUrl?: string;
    links?: ModuleLink[];
    subtitles?: SubtitleTrack[];
    durationSec: number;
    isFree?: boolean;
  }>;
};

export type PatchCourseBody = Partial<
  Pick<
    Course,
    | 'title'
    | 'skillId'
    | 'description'
    | 'thumbnail'
    | 'pdfUrl'
    | 'level'
    | 'accessTier'
    | 'isActive'
    | 'isPremium'
    | 'order'
  >
>;

export type SyncCurriculumBody = {
  moduleTitle?: string;
  lessons: Array<{
    id?: string;
    title: string;
    videoUrl: string;
    pdfUrl?: string;
    links?: ModuleLink[];
    subtitles?: SubtitleTrack[];
    durationSec: number;
    order: number;
    isFree: boolean;
  }>;
};

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  isActive: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  activeSubscriptions: number;
}

export interface AdminUserRow {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  selectedPlan?: string;
  subscriptionId?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  onboardingCompleted: boolean;
  coins?: number;
  totalSpent?: number;
  lastPaymentAt?: string | null;
  createdAt: string | null;
}

export interface SubscriptionCodeRow {
  id: string;
  planId: string;
  durationDays: number;
  used: boolean;
  usedBy?: string;
  usedAt: string | null;
  createdAt: string | null;
}

// ============================================================================
// Pagos / Ingresos
// ============================================================================

export type PaymentMethod =
  | 'Apple IAP'
  | 'Apple Pay'
  | 'Google Play'
  | 'Stripe'
  | 'MercadoPago'
  | 'Mock';

export type PaymentStatus = 'paid' | 'refunded' | 'pending';
export type PaymentCycle = 'monthly' | 'yearly';

export interface PaymentRow {
  id: string;
  userId: string;
  /** Plan canonico: 'free' | 'pro' | 'elite' (string libre para futuros planes). */
  plan: string;
  planLabel: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  txId: string;
  /** ISO-8601, null si el doc no tenia paidAt valido. */
  paidAt: string | null;
  status: PaymentStatus;
  cycle?: PaymentCycle;
  couponCode?: string;
}

export interface RevenueKpis {
  totalRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  avgTicket: number;
  paidCount: number;
  refundedCount: number;
  /** Suma mensualizada de suscripciones activas (active + trialing). */
  mrr: number;
  currency: string;
  byPlan: Array<{ plan: string; count: number; revenue: number }>;
  byMethod: Array<{ method: string; count: number; revenue: number }>;
  /** Serie diaria YYYY-MM-DD para los ultimos N dias (default 90). */
  timeseries: Array<{ day: string; revenue: number; count: number }>;
}

// ============================================================================
// Retencion / Cohortes / Churn / LTV
// ============================================================================

export interface CohortBucket {
  /** Etiqueta de la cohorte: 'YYYY-WW' (semana ISO) o 'YYYY-MM' (mes). */
  cohort: string;
  /** Inicio de la cohorte en ISO (para tooltip). */
  startDate: string;
  /** Tamano total de la cohorte (usuarios que se registraron en ese periodo). */
  size: number;
  /** Porcentaje de retencion en semana 0..N (0 = misma semana de signup). */
  retention: number[];
}

export interface RetentionKpis {
  /** % de usuarios creados hace >=1d activos al dia 1. */
  d1: number;
  d7: number;
  d30: number;
  /** % de subscripciones canceladas en el mes en curso. */
  churnMonthly: number;
  /** ARPU / churnMonthly (con fallback). */
  ltv: number;
  /** Ingresos del mes / pagadores unicos del mes. */
  arpu: number;
  payingUsers: number;
  ltvByPlan: Array<{ plan: string; ltv: number; arpu: number; payers: number }>;
  /** Serie mensual ultimos 6 meses. */
  churnSeries: Array<{ month: string; cancelled: number; activeStart: number; rate: number }>;
}

// ============================================================================
// Coins
// ============================================================================

export type CoinTxType = 'earned' | 'spent' | 'admin_adjust';

export interface CoinTxRow {
  id: string;
  userId: string;
  amount: number;
  type: CoinTxType;
  reason: string;
  createdAt: string | null;
  /** Solo presente cuando type === 'admin_adjust'. */
  adminUid?: string;
  adminEmail?: string;
}

export interface CoinsHistoryResponse {
  items: CoinTxRow[];
  nextCursor: string | null;
  balance: number;
}

export interface GrantCoinsBody {
  amount: number;
  reason: string;
}

export interface AdjustCoinsBody {
  delta: number;
  reason: string;
}

// ============================================================================
// Detalle de alumno
// ============================================================================

export interface SubscriptionSummary {
  planId: string;
  status: string;
  source: string;
  cycle: string;
  startDate: string | null;
  endDate: string | null;
  couponCode?: string;
  discountPercent?: number;
}

export interface UserDetail {
  user: AdminUserRow;
  subscription: SubscriptionSummary | null;
  payments: PaymentRow[];
  coinsBalance: number;
  coinsHistory: CoinTxRow[];
}
