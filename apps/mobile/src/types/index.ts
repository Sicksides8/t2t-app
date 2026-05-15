import type { NavigatorScreenParams } from '@react-navigation/native';

export type UserRole = 'student' | 'admin' | 'none';

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
  coins?: number;
  level?: number;
  savedCourseIds?: string[];
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

export interface Course {
  id: string;
  title: string;
  skillId: string;
  description: string;
  thumbnail?: string;
  totalLessons: number;
  durationMin: number;
  level: 'beginner' | 'intermediate' | 'advanced';
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

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  videoUrl: string;
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
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  source: 'purchase' | 'code';
  startDate: Date;
  endDate: Date;
}

export interface DiagnosticResult {
  userId?: string;
  answers: Record<string, number>;
  scores: Record<string, number>;
  topSkills: string[];
  weakSkills: string[];
  completedAt?: Date;
}

export type NotificationType =
  | 'lesson_reminder'
  | 'challenge_available'
  | 'subscription_expiring'
  | 'achievement_earned'
  | 'general';

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

export interface Achievement {
  id: string;
  userId: string;
  type: 'certificate' | 'streak' | 'coins' | 'course_completed';
  title: string;
  description?: string;
  earnedAt: Date;
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
  CertificateDetail: { certificateId: string };
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
  PaymentDetail: undefined;
  DiagnosticApp: undefined;
  Certificates: undefined;
  CertificateDetail: { certificateId: string };
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
