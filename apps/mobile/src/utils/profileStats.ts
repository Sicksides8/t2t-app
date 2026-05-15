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
): { streakDays: number; coins: number; modules: number } {
  const entries = Object.values(progressMap);
  const modules = entries.reduce((sum, p) => sum + p.lessonsCompleted.length, 0);
  const coins = user?.coins ?? 0;

  const activeDays = new Set<string>();
  for (const p of entries) {
    if (!p.lessonsCompleted.length || !p.updatedAt) continue;
    const d = p.updatedAt instanceof Date ? p.updatedAt : new Date(p.updatedAt);
    if (!Number.isNaN(d.getTime())) activeDays.add(d.toISOString().slice(0, 10));
  }

  return { streakDays: activeDays.size, coins, modules };
}
