import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CoinBanner } from '../../components/academy';
import { Button, CardGlass, ProgressBar } from '../../components/ui';
import { COURSE_COINS } from '../../services/gamificationService';
import { courses as seedCourses, lessons as seedLessons, modules as seedModules, skills } from '../../data/academy';
import { getLessons, getModules } from '../../services/academyService';
import { fetchCourseById } from '../../services/courseService';
import { enrollInCourse } from '../../services/progressService';
import { useAcademyStore } from '../../stores';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import type { Course, CourseModule, Lesson, RootStackParamList } from '../../types';

const LEVEL_LABELS: Record<Course['level'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

function formatDurationMin(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  return `${min} min`;
}

export function CourseDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'CourseDetail'>) {
  const { courseId } = route.params;
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const progress = useAcademyStore((state) => state.progress[courseId]);
  const completedSet = useMemo(() => new Set(progress?.lessonsCompleted ?? []), [progress?.lessonsCompleted]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [c, m, l] = await Promise.all([
          fetchCourseById(courseId),
          getModules(courseId),
          getLessons(courseId),
        ]);
        if (cancelled) return;
        setCourse(c ?? seedCourses.find((item) => item.id === courseId) ?? null);
        setModules(m.length ? m : seedModules.filter((mod) => mod.courseId === courseId));
        setCourseLessons(l.length ? l : seedLessons.filter((lesson) => lesson.courseId === courseId));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const lessonsByModule = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const lesson of courseLessons) {
      const list = map.get(lesson.moduleId) ?? [];
      list.push(lesson);
      map.set(lesson.moduleId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.order - b.order);
    }
    return map;
  }, [courseLessons]);

  const skill = skills.find((s) => s.id === course?.skillId);
  const sortedModules = useMemo(() => [...modules].sort((a, b) => a.order - b.order), [modules]);

  const openLesson = (lessonId: string) => {
    navigation.navigate('VideoPlayer', { courseId, lessonId });
  };

  const onStart = async () => {
    await enrollInCourse(courseId);
    const next =
      courseLessons.find((lesson) => !completedSet.has(lesson.id)) ?? courseLessons[0];
    if (next) openLesson(next.id);
  };

  if (loading || !course) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accentPrimary} size="large" />
      </View>
    );
  }

  const moduleCount = sortedModules.length || 1;
  const lessonCount = courseLessons.length || course.totalLessons;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <LinearGradient
            colors={[Colors.accentPrimary, Colors.bgSurface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroTop}>
            <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.iconBtn}>
              <Ionicons name="share-social-outline" size={18} color={Colors.textPrimary} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reproducir primera lección"
            onPress={() => void onStart()}
            style={styles.heroPlay}
          >
            <Ionicons name="play" size={32} color={Colors.textPrimary} />
          </Pressable>
          {course.isPremium ? (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.info}>
          {skill ? (
            <Text style={[styles.areaTag, { color: skill.color }]}>{skill.name.toUpperCase()}</Text>
          ) : null}
          <Text style={styles.courseTitle}>{course.title}</Text>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitials}>T2T</Text>
            </View>
            <View>
              <Text style={styles.authorName}>Equipo T2T Academy</Text>
              <Text style={styles.authorMeta}>
                {moduleCount} módulos · {course.durationMin} min · {LEVEL_LABELS[course.level]}
              </Text>
            </View>
          </View>
          <Text style={styles.description}>{course.description}</Text>
          {progress ? <ProgressBar value={progress.percentComplete} /> : null}
        </View>

        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Módulos</Text>
          {sortedModules.length === 0 ? (
            <Text style={styles.emptyLessons}>No hay lecciones cargadas para este curso.</Text>
          ) : (
            sortedModules.map((mod, modIndex) => {
              const modLessons = lessonsByModule.get(mod.id) ?? [];
              return (
                <View key={mod.id} style={styles.moduleBlock}>
                  <Text style={styles.moduleTitle}>
                    Módulo {modIndex + 1}: {mod.title}
                  </Text>
                  {modLessons.map((lesson, lessonIndex) => {
                    const done = completedSet.has(lesson.id);
                    return (
                      <Pressable
                        key={lesson.id}
                        accessibilityRole="button"
                        onPress={() => openLesson(lesson.id)}
                        style={({ pressed }) => [styles.lessonRow, pressed && styles.lessonPressed]}
                      >
                        <View style={[styles.lessonIcon, done && styles.lessonIconDone]}>
                          <Ionicons
                            name={done ? 'checkmark' : 'play'}
                            size={16}
                            color={done ? Colors.bgPrimary : Colors.accentPrimary}
                          />
                        </View>
                        <View style={styles.lessonTextCol}>
                          <Text style={styles.lessonTitle}>
                            {lessonIndex + 1} · {lesson.title.replace(/^Lección \d+: /, '')}
                          </Text>
                          <Text style={[styles.lessonMeta, done && styles.lessonMetaDone]}>
                            {formatDurationMin(lesson.durationSec)}
                            {done ? ' · completado' : lesson.isFree ? ' · gratis' : ''}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                      </Pressable>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>

        <CoinBanner amount={COURSE_COINS} />

        <Button title="Empezar curso" onPress={() => void onStart()} />
        <Text style={styles.lessonCountHint}>
          {lessonCount} lecciones · tocá cualquier fila para abrir el video
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  hero: {
    height: 280,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: 118,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },
  proBadge: {
    position: 'absolute',
    left: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: Colors.accentPrimary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  proBadgeText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  info: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  areaTag: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  courseTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitials: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  authorName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  authorMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  modulesSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  moduleBlock: {
    gap: Spacing.sm,
  },
  moduleTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  lessonPressed: {
    opacity: 0.9,
  },
  lessonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  lessonIconDone: {
    backgroundColor: Colors.accentSecondary,
    borderColor: Colors.accentSecondary,
  },
  lessonTextCol: {
    flex: 1,
  },
  lessonTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  lessonMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  lessonMetaDone: {
    color: Colors.accentSecondary,
    fontWeight: '500',
  },
  coinsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: '#4CC35B4D',
    borderColor: '#4CC35B66',
  },
  coinsText: {
    ...Typography.bodyMedium,
    color: Colors.accentHighlight,
    fontWeight: '600',
    flex: 1,
  },
  lessonCountHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  emptyLessons: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
