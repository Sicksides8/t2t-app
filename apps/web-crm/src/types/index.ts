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
  level: Course['level'];
  isActive?: boolean;
  isPremium?: boolean;
  order?: number;
  moduleTitle?: string;
  lessons: Array<{
    title: string;
    videoUrl?: string;
    durationSec: number;
    isFree?: boolean;
  }>;
};

export type PatchCourseBody = Partial<
  Pick<Course, 'title' | 'skillId' | 'description' | 'thumbnail' | 'level' | 'isActive' | 'isPremium' | 'order'>
>;

export type SyncCurriculumBody = {
  moduleTitle?: string;
  lessons: Array<{
    id?: string;
    title: string;
    videoUrl: string;
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
  onboardingCompleted: boolean;
  coins?: number;
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
