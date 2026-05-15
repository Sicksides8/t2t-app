import { create } from 'zustand';
import type { CourseProgress } from '../types';

interface ProgressState {
  byCourse: Record<string, CourseProgress>;
  setProgress: (courseId: string, progress: CourseProgress) => void;
  patchLesson: (courseId: string, lessonId: string, percentFallback: number) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  byCourse: {},

  setProgress: (courseId, progress) =>
    set((state) => ({
      byCourse: { ...state.byCourse, [courseId]: progress },
    })),

  patchLesson: (courseId, lessonId, percentFallback) => {
    const current = get().byCourse[courseId];
    const lessonsCompleted = Array.from(new Set([...(current?.lessonsCompleted || []), lessonId]));
    const percentComplete = current?.percentComplete
      ? Math.min(100, Math.max(current.percentComplete, percentFallback))
      : Math.min(100, percentFallback);

    set((state) => ({
      byCourse: {
        ...state.byCourse,
        [courseId]: {
          courseId,
          lessonsCompleted,
          currentLessonId: lessonId,
          percentComplete,
          updatedAt: new Date(),
        },
      },
    }));
  },
}));
