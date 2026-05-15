import { create } from 'zustand';
import type { Course } from '../types';
import { fetchCourses } from '../services/courseService';

interface CourseState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  selectedSkillId?: string;
  load: (skillId?: string) => Promise<void>;
  setSelectedSkill: (skillId?: string) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  loading: false,
  error: null,
  selectedSkillId: undefined,

  setSelectedSkill: (skillId) => set({ selectedSkillId: skillId }),

  load: async (skillId) => {
    set({ loading: true, error: null });
    try {
      const courses = await fetchCourses(skillId);
      set({ courses, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'No pudimos cargar cursos', loading: false });
    }
  },
}));
