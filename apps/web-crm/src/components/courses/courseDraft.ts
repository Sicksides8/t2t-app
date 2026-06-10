import type { CourseAccessTier, CourseLevel, LessonDraft } from '../../types';

export type CourseFormSnapshot = {
  title: string;
  skillId: string;
  description: string;
  thumbnail: string;
  pdfUrl: string;
  level: CourseLevel;
  accessTier: CourseAccessTier;
  isActive: boolean;
  isPremium: boolean;
  lessons: LessonDraft[];
};

export type StoredDraft = {
  savedAt: number;
  data: CourseFormSnapshot;
};

const NS = 't2t.crm.courseDraft';

export function draftKey(scope: 'new' | string): string {
  return `${NS}.${scope}`;
}

export function loadDraft(scope: 'new' | string): StoredDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(draftKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(scope: 'new' | string, data: CourseFormSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredDraft = { savedAt: Date.now(), data };
    window.localStorage.setItem(draftKey(scope), JSON.stringify(payload));
  } catch {
    // localStorage lleno o bloqueado — silencioso
  }
}

export function clearDraft(scope: 'new' | string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(draftKey(scope));
  } catch {
    // noop
  }
}

export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const seconds = Math.max(0, Math.round(diffMs / 1000));
  if (seconds < 5) return 'ahora';
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}
