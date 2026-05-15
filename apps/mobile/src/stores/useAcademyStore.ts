import { create } from 'zustand';
import type { Course, CourseProgress, DiagnosticResult, Plan } from '../types';
import { courses, plans } from '../data/academy';
import { computeDiagnosticScores } from '../data/diagnostic';

interface AcademyState {
  courses: Course[];
  plans: Plan[];
  selectedCourseId?: string;
  diagnostic: DiagnosticResult;
  progress: Record<string, CourseProgress>;
  setAnswer: (questionId: string, value: number) => void;
  completeDiagnostic: () => DiagnosticResult;
  selectCourse: (courseId: string) => void;
  markLessonComplete: (courseId: string, lessonId: string, totalLessons?: number) => void;
}

export const useAcademyStore = create<AcademyState>((set, get) => ({
  courses,
  plans,
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
    const { scores, topSkills, weakSkills } = computeDiagnosticScores(answers);
    const diagnostic: DiagnosticResult = {
      answers,
      scores,
      topSkills,
      weakSkills,
      completedAt: new Date(),
    };
    set({ diagnostic });
    return diagnostic;
  },

  selectCourse: (courseId) => set({ selectedCourseId: courseId }),

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
