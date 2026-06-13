import type { CourseProgress, User } from '../types';

export function profileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'T2';
  return parts
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function computeProfileStats(
  progressMap: Record<string, CourseProgress>,
  user: User | null,
): { streakDays: number; longestStreak: number; freezes: number; coins: number; modules: number } {
  const entries = Object.values(progressMap);
  const modules = entries.reduce((sum, p) => sum + p.lessonsCompleted.length, 0);
  const coins = user?.coins ?? 0;
  const streakDays = user?.currentStreak ?? 0;
  const longestStreak = user?.longestStreak ?? 0;
  const freezes = user?.streakFreezesAvailable ?? 0;

  return { streakDays, longestStreak, freezes, coins, modules };
}
