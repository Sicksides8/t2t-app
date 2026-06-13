import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CoinBanner,
  LessonLinkChip,
  LessonLinkMoreChip,
  LessonResourcesSheet,
  PaywallModal,
} from '../../components/academy';
import { AppBackground } from '../../components/penpot';
import { Button, ProgressBar } from '../../components/ui';
import { COURSE_COINS } from '../../services/gamificationService';
import { skills } from '../../data/academy';
import { getLessons, getModules } from '../../services/academyService';
import { fetchCourseById } from '../../services/courseService';
import { enrollInCourse } from '../../services/progressService';
import { useAcademyStore, useAuthStore } from '../../stores';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import type { Course, CourseModule, Lesson, ModuleLink, RootStackParamList } from '../../types';
import { openExternalLink } from '../../utils/openExternalLink';
import { canAccessCourse, canAccessLesson, getRequiredPlan } from '../../utils/subscriptionAccess';

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
  const [resourcesSheet, setResourcesSheet] = useState<
    { title: string; links: ModuleLink[]; pdfUrl?: string } | null
  >(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const user = useAuthStore((state) => state.user);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
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
        setCourse(c ?? null);
        setModules(m);
        setCourseLessons(l);
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
    if (!course) return;
    const lesson = courseLessons.find((l) => l.id === lessonId);
    if (lesson && !canAccessLesson(lesson, course, user)) {
      setPaywallVisible(true);
      return;
    }
    navigation.navigate('VideoPlayer', { courseId, lessonId });
  };

  const onStart = async () => {
    if (course && !canAccessCourse(course, user)) {
      setPaywallVisible(true);
      return;
    }
    await enrollInCourse(courseId);
    const next =
      courseLessons.find((lesson) => !completedSet.has(lesson.id)) ?? courseLessons[0];
    if (next) openLesson(next.id);
  };

  if (loading || !course) {
    return (
      <View style={styles.screen}>
        <AppBackground variant="default" />
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.accentPrimary} size="large" />
        </View>
      </View>
    );
  }

  const moduleCount = sortedModules.length || 1;
  const coursePdfUrl = course.pdfUrl ?? courseLessons.find((l) => l.pdfUrl)?.pdfUrl;
  const requiredPlan = getRequiredPlan(course);
  const planBadgeLabel = requiredPlan === 'elite' ? 'ELITE' : requiredPlan === 'pro' ? 'PRO' : null;

  const nextLesson = courseLessons.find((lesson) => !completedSet.has(lesson.id)) ?? courseLessons[0];
  const nextModuleIndex = (() => {
    if (!nextLesson) return 1;
    const modIdx = sortedModules.findIndex((m) => m.id === nextLesson.moduleId);
    return modIdx >= 0 ? modIdx + 1 : 1;
  })();

  return (
    <View style={styles.screen}>
      <AppBackground variant="default" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.hero}>
            <LinearGradient
              colors={['#6E1AAE', '#C040EE']}
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
              accessibilityLabel="Reproducir primer módulo"
              onPress={() => void onStart()}
              style={styles.heroPlay}
            >
              <Ionicons name="play" size={36} color={Colors.textPrimary} style={styles.heroPlayIcon} />
            </Pressable>
            {planBadgeLabel ? (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>{planBadgeLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.info}>
            {skill ? (
              <Text style={[styles.areaTag, { color: Colors.accentPrimary }]}>
                {skill.name.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.courseTitle}>{course.title}</Text>
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <Text style={styles.authorInitials}>GR</Text>
              </View>
              <View>
                <Text style={styles.authorName}>Gustavo Rodríguez</Text>
                <Text style={styles.authorMeta}>
                  {moduleCount} módulos · {course.durationMin} min
                </Text>
              </View>
            </View>
            <Text style={styles.description}>{course.description}</Text>
            {progress ? <ProgressBar value={progress.percentComplete} /> : null}
          </View>

          <View style={styles.modulesSection}>
            <Text style={styles.sectionTitle}>Módulos</Text>
            {sortedModules.length === 0 ? (
              <Text style={styles.emptyLessons}>No hay módulos cargados para este curso.</Text>
            ) : (
              sortedModules.map((mod, modIndex) => {
                const modLessons = lessonsByModule.get(mod.id) ?? [];
                const firstLesson = modLessons[0];
                const allDone = modLessons.length > 0 && modLessons.every((l) => completedSet.has(l.id));
                const totalMin = Math.max(
                  1,
                  Math.round(modLessons.reduce((sum, l) => sum + l.durationSec, 0) / 60),
                );

                // Bloqueo por plan: si el user no puede acceder a la primera
                // lección del módulo (y no es gratuita), mostramos candado en
                // la row y meta con el plan requerido. La lección "gratis"
                // (lesson.isFree) sigue accesible vía sub-row.
                const lockedFirst = firstLesson
                  ? !canAccessLesson(firstLesson, course, user)
                  : false;
                const freeLessonInMod = modLessons.find((l) => l.isFree === true);
                const hasFreeFallback = lockedFirst && Boolean(freeLessonInMod);
                const metaPlanLabel =
                  lockedFirst && !hasFreeFallback ? ` · ${planBadgeLabel ?? 'PRO'}` : '';

                const dedupedLinks: ModuleLink[] = [];
                const seen = new Set<string>();
                for (const lesson of modLessons) {
                  for (const link of lesson.links ?? []) {
                    if (!link?.url || seen.has(link.url)) continue;
                    seen.add(link.url);
                    dedupedLinks.push(link);
                  }
                }
                const modPdfUrl = modLessons.find((l) => l.pdfUrl)?.pdfUrl;
                const visibleChips = dedupedLinks.slice(0, 3);
                const remainingChips = dedupedLinks.length - visibleChips.length;
                const hasResources = dedupedLinks.length > 0 || Boolean(modPdfUrl);

                const openModuleResources = () =>
                  setResourcesSheet({
                    title: `Recursos · ${mod.title}`,
                    links: dedupedLinks,
                    pdfUrl: modPdfUrl,
                  });

                return (
                  <View key={mod.id} style={styles.moduleBlock}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => (firstLesson ? openLesson(firstLesson.id) : null)}
                      style={({ pressed }) => [
                        styles.moduleRow,
                        allDone && styles.moduleRowDone,
                        pressed && styles.lessonPressed,
                      ]}
                    >
                      <View style={allDone ? styles.modIconDone : styles.modIconPending}>
                        {allDone ? (
                          <Ionicons name="checkmark" size={18} color="#0E2A14" />
                        ) : lockedFirst ? (
                          <Ionicons name="lock-closed" size={16} color={Colors.textPrimary} />
                        ) : (
                          <Text style={styles.modNumber}>{modIndex + 1}</Text>
                        )}
                      </View>
                      <View style={styles.lessonTextCol}>
                        <Text style={styles.lessonTitle}>
                          {modIndex + 1} · {mod.title}
                        </Text>
                        <Text style={[styles.lessonMeta, allDone && styles.lessonMetaDone]}>
                          {totalMin} min · {allDone ? 'completado' : 'pendiente'}
                          {metaPlanLabel}
                        </Text>
                      </View>
                    </Pressable>

                    {hasFreeFallback && freeLessonInMod ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Reproducir lección gratis"
                        onPress={() => openLesson(freeLessonInMod.id)}
                        style={({ pressed }) => [
                          styles.freeLessonPill,
                          pressed && styles.lessonPressed,
                        ]}
                      >
                        <Ionicons name="play-circle-outline" size={16} color={Colors.accentPrimary} />
                        <Text style={styles.freeLessonText}>Lección gratis disponible</Text>
                      </Pressable>
                    ) : null}

                    {hasResources ? (
                      <View style={styles.linksRow}>
                        {modPdfUrl ? (
                          <LessonLinkChip
                            label="PDF"
                            url={modPdfUrl}
                            onPress={() => void openExternalLink(modPdfUrl)}
                          />
                        ) : null}
                        {visibleChips.map((link, i) => (
                          <LessonLinkChip
                            key={`${link.url}-${i}`}
                            url={link.url}
                            label={link.label}
                          />
                        ))}
                        {remainingChips > 0 ? (
                          <LessonLinkMoreChip count={remainingChips} onPress={openModuleResources} />
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.bannerSection}>
            <CoinBanner amount={COURSE_COINS} />
          </View>

          {coursePdfUrl ? (
            <View style={styles.scrollFooter}>
              <Pressable
                style={styles.outlineBtn}
                accessibilityRole="button"
                onPress={() => void openExternalLink(coursePdfUrl)}
              >
                <Ionicons name="download-outline" size={18} color={Colors.accentPrimary} />
                <Text style={styles.outlineText}>Descargar ejercicio (PDF)</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.fixedFooter}>
          <Button
            title={`▶  Continuar · Módulo ${nextModuleIndex}`}
            onPress={() => void onStart()}
          />
        </View>
      </SafeAreaView>

      <LessonResourcesSheet
        visible={resourcesSheet != null}
        title={resourcesSheet?.title}
        links={resourcesSheet?.links}
        pdfUrl={resourcesSheet?.pdfUrl}
        onClose={() => setResourcesSheet(null)}
      />

      <PaywallModal
        visible={paywallVisible}
        planId={requiredPlan === 'free' ? 'pro' : requiredPlan}
        title={requiredPlan === 'elite' ? 'Contenido ELITE' : 'Contenido PRO'}
        userId={user?.id}
        onClose={() => setPaywallVisible(false)}
        onSuccess={() => {
          void refreshUserProfile();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 24,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    height: 300,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 8,
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
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: 110,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF66',
  },
  heroPlayIcon: {
    marginLeft: 4,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A1052',
    borderWidth: 1.5,
    borderColor: Colors.accentPrimary,
  },
  authorInitials: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
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
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 4,
  },
  moduleBlock: {
    gap: 0,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  moduleRowDone: {
    backgroundColor: '#1F0A40CC',
    borderColor: '#4CC35B33',
  },
  lessonPressed: {
    opacity: 0.9,
  },
  modIconPending: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
  },
  modIconDone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modNumber: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 13,
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
  bannerSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  scrollFooter: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  fixedFooter: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: 8,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#B73CEF14',
    borderWidth: 1.5,
    borderColor: '#B73CEF55',
  },
  outlineText: {
    color: Colors.accentPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyLessons: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  freeLessonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginLeft: 14 + 32 + Spacing.md,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#B73CEF14',
    borderWidth: 1,
    borderColor: '#B73CEF55',
  },
  freeLessonText: {
    ...Typography.caption,
    color: Colors.accentPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
});
