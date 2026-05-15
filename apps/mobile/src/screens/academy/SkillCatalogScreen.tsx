import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CourseCard, CourseFiltersSheet, type CourseFilters } from '../../components/academy';
import { ScreenWrapper } from '../../components/ui';
import { CourseListSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { courses as seedCourses, skills } from '../../data/academy';
import { getCoursesBySkill } from '../../services/academyService';
import { useAcademyStore } from '../../stores';
import { Colors, Spacing, Typography } from '../../theme';
import type { Course, RootStackParamList } from '../../types';

export function SkillCatalogScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'SkillCatalog'>) {
  const { skillId, skillName } = route.params;
  const skill = skills.find((s) => s.id === skillId);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CourseFilters>({});
  const progressMap = useAcademyStore((state) => state.progress);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const list = await getCoursesBySkill(skillId);
      if (!cancelled) {
        setCourses(list.length ? list : seedCourses.filter((c) => c.skillId === skillId));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  const filtered = useMemo(() => {
    let base = [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (filters.level) base = base.filter((c) => c.level === filters.level);
    if (filters.maxDurationMin) base = base.filter((c) => c.durationMin <= filters.maxDurationMin!);
    if (filters.onlyNotStarted) base = base.filter((c) => !(progressMap[c.id]?.percentComplete > 0));
    return base;
  }, [courses, filters, progressMap]);

  const title = skillName || skill?.name || 'Catálogo';

  return (
    <ScreenWrapper scroll>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        <Text style={styles.backText}>Volver</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{skill?.description || 'Cursos de esta habilidad'}</Text>

      {loading ? <CourseListSkeleton /> : null}
      {!loading && !filtered.length ? (
        <EmptyState title="Sin cursos" message="Pronto habrá más contenido en esta categoría." />
      ) : null}

      {filtered.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          progressPercent={progressMap[course.id]?.percentComplete}
          onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
        />
      ))}

      <CourseFiltersSheet
        visible={filterOpen}
        filters={filters}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  backText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
});
