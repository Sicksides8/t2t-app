import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CelebrationModal, ModuleCompleteModal } from '../../components/academy';
import { Button, ScreenWrapper } from '../../components/ui';
import { getLessonVideoUrl } from '../../constants/media';
import { lessons as seedLessons, modules as seedModules } from '../../data/academy';
import { getLessons, getModules } from '../../services/academyService';
import { awardLessonCompletion, COURSE_COINS, LESSON_COINS } from '../../services/gamificationService';
import { completeLesson, localProgressUpdate } from '../../services/progressService';
import { useAcademyStore, useAuthStore, useProgressStore } from '../../stores';
import { isModuleJustCompleted } from '../../utils/moduleProgress';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import type { CourseModule, Lesson, RootStackParamList } from '../../types';

function LessonVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const source = getLessonVideoUrl(videoUrl);
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
      contentFit="contain"
      fullscreenOptions={{ enable: true }}
    />
  );
}

/** Penpot: 57_Reproductor_Video */
export function VideoPlayerScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'VideoPlayer'>) {
  const markLessonComplete = useAcademyStore((state) => state.markLessonComplete);
  const progressMap = useAcademyStore((state) => state.progress);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [listOpen, setListOpen] = useState(true);
  const [courseModal, setCourseModal] = useState(false);
  const [moduleModal, setModuleModal] = useState<{ title?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [coinsBanner, setCoinsBanner] = useState<number | null>(null);
  const coinsBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeLessonId = route.params.lessonId;

  useEffect(() => {
    return () => {
      if (coinsBannerTimer.current) clearTimeout(coinsBannerTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [remoteLessons, remoteModules] = await Promise.all([
        getLessons(route.params.courseId),
        getModules(route.params.courseId),
      ]);
      const list = remoteLessons.length
        ? remoteLessons
        : seedLessons.filter((item) => item.courseId === route.params.courseId);
      const mods = remoteModules.length
        ? remoteModules
        : seedModules.filter((m) => m.courseId === route.params.courseId);
      if (!cancelled) {
        setLessons(list.sort((a, b) => a.order - b.order));
        setModules(mods);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params.courseId]);

  const lesson = useMemo(() => {
    return lessons.find((item) => item.id === activeLessonId) || lessons[0] || null;
  }, [lessons, activeLessonId]);

  const totalLessons = lessons.length || 1;
  const courseProgress = progressMap[route.params.courseId];
  const completedBefore = lesson ? courseProgress?.lessonsCompleted.includes(lesson.id) : false;

  const handleComplete = async () => {
    if (!lesson || busy) return;
    setBusy(true);
    try {
      const previouslyCompleted = courseProgress?.lessonsCompleted ?? [];
      const updated = localProgressUpdate(courseProgress, route.params.courseId, lesson.id, totalLessons);
      markLessonComplete(route.params.courseId, lesson.id, totalLessons);
      useProgressStore.getState().setProgress(route.params.courseId, updated);
      await completeLesson(route.params.courseId, lesson.id, updated);

      if (!completedBefore) {
        await awardLessonCompletion(route.params.courseId, lesson.id);
        await refreshUserProfile();
      }

      const idx = lessons.findIndex((l) => l.id === lesson.id);
      const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
      const justFinishedCourse = updated.percentComplete >= 100;

      if (justFinishedCourse) {
        setCourseModal(true);
        return;
      }

      const moduleDone = isModuleJustCompleted(modules, lessons, courseProgress, lesson.id, previouslyCompleted);
      if (moduleDone.completed && !completedBefore) {
        setModuleModal({ title: moduleDone.moduleTitle });
        return;
      }

      if (!completedBefore) {
        setCoinsBanner(LESSON_COINS);
        if (coinsBannerTimer.current) clearTimeout(coinsBannerTimer.current);
        coinsBannerTimer.current = setTimeout(() => setCoinsBanner(null), 2200);
      }

      if (next) {
        navigation.setParams({ lessonId: next.id });
      } else {
        navigation.goBack();
      }
    } finally {
      setBusy(false);
    }
  };

  const continueAfterModule = () => {
    setModuleModal(null);
    const idx = lessons.findIndex((l) => l.id === lesson?.id);
    const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
    if (next) navigation.setParams({ lessonId: next.id });
    else navigation.goBack();
  };

  if (!lesson) {
    return (
      <ScreenWrapper>
        <ActivityIndicator color={Colors.accentPrimary} size="large" style={{ marginTop: Spacing.xxl }} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backLink}>
        <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        <Text style={styles.backLinkText}>Volver al curso</Text>
      </Pressable>

      {coinsBanner != null ? (
        <View style={styles.coinsToast}>
          <Ionicons name="logo-bitcoin" size={18} color={Colors.accentSecondary} />
          <Text style={styles.coinsToastText}>+{coinsBanner} T2T Coins · Siguiente lección</Text>
        </View>
      ) : null}

      <View style={styles.playerChrome}>
        <LessonVideoPlayer key={lesson.id} videoUrl={lesson.videoUrl} />
      </View>

      <Text style={styles.title}>{lesson.title}</Text>
      <Button title="Completar lección" loading={busy} onPress={() => void handleComplete()} />

      <Pressable onPress={() => setListOpen((o) => !o)} style={styles.listToggle}>
        <Text style={styles.listToggleText}>Lecciones del curso ({lessons.length})</Text>
        <Ionicons name={listOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
      </Pressable>

      {listOpen ? (
        <ScrollView style={styles.lessonList}>
          {lessons.map((item) => {
            const done = courseProgress?.lessonsCompleted.includes(item.id);
            return (
              <Pressable
                key={item.id}
                style={[styles.lessonRow, item.id === lesson.id && styles.lessonRowActive]}
                onPress={() => navigation.setParams({ lessonId: item.id })}
              >
                <Ionicons
                  name={done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={done ? Colors.accentSecondary : Colors.textTertiary}
                />
                <Text style={styles.lessonRowText} numberOfLines={2}>
                  {item.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ModuleCompleteModal
        visible={moduleModal != null}
        moduleTitle={moduleModal?.title}
        onContinue={continueAfterModule}
        onClose={() => setModuleModal(null)}
      />

      <CelebrationModal
        variant="course"
        visible={courseModal}
        title="¡Curso completado!"
        body="Desbloqueaste un hito importante en tu academia."
        coins={COURSE_COINS}
        primaryLabel="Ver mis cursos"
        secondaryLabel="Cerrar"
        icon="trophy"
        onPrimary={() => {
          setCourseModal(false);
          navigation.navigate('Main');
        }}
        onSecondary={() => {
          setCourseModal(false);
          navigation.goBack();
        }}
        onClose={() => setCourseModal(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  backLinkText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  coinsToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'center',
    backgroundColor: Colors.glass,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  coinsToastText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  playerChrome: {
    borderRadius: Radius.cardLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: Spacing.md,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.black,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  listToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  listToggleText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  lessonList: {
    maxHeight: 220,
    marginTop: Spacing.sm,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.card,
    marginBottom: Spacing.xs,
  },
  lessonRowActive: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  lessonRowText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
});
