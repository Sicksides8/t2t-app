import { create } from 'zustand';
import { collection, getDocs } from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from '../services/firebase';
import type { CourseProgress, DiagnosticResult } from '../types';
import { computeDiagnosticScores } from '../data/diagnostic';
import { buildLessonCompleteProgress, buildWatchProgressUpdate } from '../utils/courseProgress';

interface AcademyState {
  selectedCourseId?: string;
  diagnostic: DiagnosticResult;
  progress: Record<string, CourseProgress>;
  setAnswer: (questionId: string, value: number) => void;
  beginDiagnosticRetake: () => void;
  completeDiagnostic: () => DiagnosticResult;
  selectCourse: (courseId: string) => void;
  markLessonComplete: (courseId: string, lessonId: string, totalLessons?: number) => void;
  markCourseStarted: (courseId: string, currentLessonId: string) => void;
  updateWatchProgress: (
    courseId: string,
    lessonId: string,
    watchedSec: number,
    durationSec: number,
    totalLessons: number,
  ) => void;
  loadUserProgress: (userId: string) => Promise<void>;
  setDiagnostic: (diagnostic: DiagnosticResult) => void;
  clearProgress: () => void;
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

  beginDiagnosticRetake: () =>
    set((state) => {
      const prev = state.diagnostic;
      const baseline =
        prev.scores && Object.keys(prev.scores).length > 0
          ? { ...prev.scores }
          : prev.baseScores
            ? { ...prev.baseScores }
            : undefined;
      return {
        diagnostic: {
          ...prev,
          answers: {},
          baseScores: baseline ?? prev.baseScores,
        },
      };
    }),

  completeDiagnostic: () => {
    const answers = get().diagnostic.answers;
    const prev = get().diagnostic;
    const { scores, baseScores, focusAreas, topSkills, weakSkills, overallScore210 } =
      computeDiagnosticScores(answers);
    const diagnostic: DiagnosticResult = {
      answers,
      scores,
      baseScores: prev.baseScores && Object.keys(prev.baseScores).length > 0
        ? prev.baseScores
        : baseScores,
      focusAreas,
      topSkills,
      weakSkills,
      overallScore210,
      completedAt: new Date(),
    };
    set({ diagnostic });
    return diagnostic;
  },

  selectCourse: (courseId) => set({ selectedCourseId: courseId }),

  markCourseStarted: (courseId, currentLessonId) =>
    set((state) => {
      const current = state.progress[courseId];
      if (current?.currentLessonId === currentLessonId) return state;
      return {
        progress: {
          ...state.progress,
          [courseId]: {
            courseId,
            lessonsCompleted: current?.lessonsCompleted ?? [],
            currentLessonId,
            percentComplete: current?.percentComplete ?? 0,
            updatedAt: new Date(),
          },
        },
      };
    }),

  updateWatchProgress: (courseId, lessonId, watchedSec, durationSec, totalLessons) =>
    set((state) => {
      const updated = buildWatchProgressUpdate(
        state.progress[courseId],
        courseId,
        lessonId,
        totalLessons,
        watchedSec,
        durationSec,
      );
      if (!updated) return state;
      return {
        progress: {
          ...state.progress,
          [courseId]: updated,
        },
      };
    }),

  markLessonComplete: (courseId, lessonId, totalLessons = 5) =>
    set((state) => ({
      progress: {
        ...state.progress,
        [courseId]: buildLessonCompleteProgress(
          state.progress[courseId],
          courseId,
          lessonId,
          totalLessons,
        ),
      },
    })),

  loadUserProgress: async (userId) => {
    if (!userId) return;
    try {
      const snap = await getDocs(
        collection(db, FS_COL.progress, userId, FS_COL.progressCoursesSub),
      );
      const next: Record<string, CourseProgress> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Partial<CourseProgress>;
        const courseId = data.courseId || docSnap.id;
        const lessonsCompleted = Array.isArray(data.lessonsCompleted) ? data.lessonsCompleted : [];
        let percentComplete = typeof data.percentComplete === 'number' ? data.percentComplete : 0;
        // Legacy: 1% por haber abierto el reproductor sin ver tiempo real.
        if (percentComplete === 1 && lessonsCompleted.length === 0) {
          percentComplete = 0;
        }
        next[courseId] = {
          courseId,
          lessonsCompleted,
          currentLessonId: data.currentLessonId,
          percentComplete: typeof data.percentComplete === 'number' ? data.percentComplete : 0,
          skillImpactApplied: Boolean(data.skillImpactApplied),
          updatedAt: data.updatedAt ? new Date(data.updatedAt as unknown as string) : new Date(),
        };
      });
      // Merge: si ya había progreso local más fresco (caso edge: usuario sin
      // red abriendo y completando), no lo pisamos.
      set((state) => {
        const merged = { ...next };
        for (const [cid, local] of Object.entries(state.progress)) {
          const remote = merged[cid];
          if (!remote || (local.percentComplete ?? 0) > (remote.percentComplete ?? 0)) {
            merged[cid] = local;
          }
        }
        return { progress: merged };
      });
    } catch {
      /* sin red o sin permisos: dejamos progreso vacío en memoria */
    }
  },

  clearProgress: () => set({ progress: {} }),

  setDiagnostic: (diagnostic) => set({ diagnostic }),
}));
