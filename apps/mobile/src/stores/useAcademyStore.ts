import { create } from 'zustand';
import type { CourseProgress, DiagnosticResult } from '../types';
import { computeDiagnosticScores } from '../data/diagnostic';

interface AcademyState {
  selectedCourseId?: string;
  diagnostic: DiagnosticResult;
  progress: Record<string, CourseProgress>;
  setAnswer: (questionId: string, value: number) => void;
  completeDiagnostic: () => DiagnosticResult;
  selectCourse: (courseId: string) => void;
  markLessonComplete: (courseId: string, lessonId: string, totalLessons?: number) => void;
  markCourseStarted: (courseId: string, currentLessonId: string) => void;
}

export const useAcademyStore = create<AcademyState>((set, get) => ({
  selectedCourseId: undefined,
  diagnostic: {
    answers: {},
    scores: {},
    topSkills: [],
    weakSkills: [],
  },
  progress: {},

  setAnswer: (questionId, value) =>
    set((state) => ({
      diagnostic: {
        ...state.diagnostic,
        answers: { ...state.diagnostic.answers, [questionId]: value },
      },
    })),

  completeDiagnostic: () => {
    const answers = get().diagnostic.answers;
    const { scores, baseScores, focusAreas, topSkills, weakSkills } =
      computeDiagnosticScores(answers);
    const diagnostic: DiagnosticResult = {
      answers,
      scores,
      baseScores,
      focusAreas,
      topSkills,
      weakSkills,
      completedAt: new Date(),
    };
    set({ diagnostic });
    return diagnostic;
  },

  selectCourse: (courseId) => set({ selectedCourseId: courseId }),

  markCourseStarted: (courseId, currentLessonId) =>
    set((state) => {
      const current = state.progress[courseId];
      if (current && current.percentComplete > 0) {
        // Ya estaba iniciado: solo refrescamos la lección actual.
        if (current.currentLessonId === currentLessonId) return state;
        return {
          progress: {
            ...state.progress,
            [courseId]: { ...current, currentLessonId, updatedAt: new Date() },
          },
        };
      }
      return {
        progress: {
          ...state.progress,
          [courseId]: {
            courseId,
            lessonsCompleted: current?.lessonsCompleted ?? [],
            currentLessonId,
            percentComplete: Math.max(current?.percentComplete ?? 0, 1),
            updatedAt: new Date(),
          },
        },
      };
    }),

  markLessonComplete: (courseId, lessonId, totalLessons = 5) =>
    set((state) => {
      const current = state.progress[courseId] || {
        courseId,
        lessonsCompleted: [],
        percentComplete: 0,
        updatedAt: new Date(),
      };
      const lessonsCompleted = Array.from(new Set([...current.lessonsCompleted, lessonId]));
      const percentComplete = Math.min(
        100,
        totalLessons > 0
          ? Math.round((lessonsCompleted.length / totalLessons) * 100)
          : lessonsCompleted.length * 15,
      );
      return {
        progress: {
          ...state.progress,
          [courseId]: {
            ...current,
            lessonsCompleted,
            currentLessonId: lessonId,
            percentComplete,
            updatedAt: new Date(),
          },
        },
      };
    }),
}));
