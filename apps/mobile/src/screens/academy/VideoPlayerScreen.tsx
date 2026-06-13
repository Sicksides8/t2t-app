import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  CelebrationModal,
  LessonResourcesSheet,
  ModuleCompleteModal,
} from '../../components/academy';
import { AppBackground } from '../../components/penpot';
import { ScreenWrapper } from '../../components/ui';
import { getLessonVideoUrl } from '../../constants/media';
import { auth } from '../../services/firebase';
import { getLessons, getModules } from '../../services/academyService';
import { awardLessonCompletion, COURSE_COINS, LESSON_COINS } from '../../services/gamificationService';
import {
  completeLesson,
  enrollInCourse,
  localProgressUpdate,
  saveProgressToFirestore,
} from '../../services/progressService';
import { useAcademyStore, useAuthStore, useProgressStore } from '../../stores';
import { isModuleJustCompleted } from '../../utils/moduleProgress';
import { Colors, Spacing } from '../../theme';
import type { CourseModule, Lesson, RootStackParamList } from '../../types';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

type VideoAspect = 'portrait' | 'landscape' | 'unknown';

export function VideoPlayerScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'VideoPlayer'>) {
  const markLessonComplete = useAcademyStore((state) => state.markLessonComplete);
  const markCourseStarted = useAcademyStore((state) => state.markCourseStarted);
  const progressMap = useAcademyStore((state) => state.progress);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [courseModal, setCourseModal] = useState(false);
  const [moduleModal, setModuleModal] = useState<{ title?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aspect, setAspect] = useState<VideoAspect>('unknown');
  const insets = useSafeAreaInsets();
  const busyRef = useRef(false);
  const startedRef = useRef(false);
  const autoCompletedRef = useRef<Set<string>>(new Set());

  const activeLessonId = route.params.lessonId;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [remoteLessons, remoteModules] = await Promise.all([
        getLessons(route.params.courseId),
        getModules(route.params.courseId),
      ]);
      if (!cancelled) {
        setLessons([...remoteLessons].sort((a, b) => a.order - b.order));
        setModules(remoteModules);
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

  const videoSource = lesson ? getLessonVideoUrl(lesson.videoUrl) : '';
  const player = useVideoPlayer(videoSource, (instance) => {
    instance.loop = false;
    instance.pause();
  });

  useEffect(() => {
    setAspect('unknown');
  }, [lesson?.id]);

  useEffect(() => {
    const readAspect = () => {
      try {
        const size = player.videoTrack?.size;
        if (size && size.width > 0 && size.height > 0) {
          setAspect(size.width >= size.height ? 'landscape' : 'portrait');
          return true;
        }
      } catch {
        /* noop */
      }
      return false;
    };

    if (readAspect()) return;
    const subscription = (player as unknown as {
      addListener: (event: string, handler: (payload: unknown) => void) => { remove: () => void };
    }).addListener('videoTrackChange', () => {
      readAspect();
    });
    return () => {
      try {
        subscription.remove();
      } catch {
        /* noop */
      }
    };
  }, [player, lesson?.id]);

  // handleComplete cambia en cada render (closures sobre estado/props).
  // Usamos un ref para que el interval llame siempre la versión más reciente.
  const handleCompleteRef = useRef<() => void>(() => {});
  const progressMapRef = useRef(progressMap);
  useEffect(() => {
    progressMapRef.current = progressMap;
  }, [progressMap]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const playing = player.playing;
        const ct = player.currentTime || 0;
        const d = player.duration && player.duration > 0 ? player.duration : 0;

        setIsPlaying(playing);
        setCurrentTime(ct);
        if (d > 0) setDuration(d);

        if (aspect === 'unknown') {
          const size = player.videoTrack?.size;
          if (size && size.width > 0 && size.height > 0) {
            setAspect(size.width >= size.height ? 'landscape' : 'portrait');
          }
        }

        // Apenas el alumno aprieta play por primera vez en este curso,
        // marcamos el curso como "iniciado". Suficiente para que aparezca
        // en "Mis cursos" → tab "En curso" sin tener que esperar al final.
        if (playing && lesson && !startedRef.current) {
          startedRef.current = true;
          const courseId = route.params.courseId;
          markCourseStarted(courseId, lesson.id);
          void enrollInCourse(courseId);
          const existing = progressMapRef.current[courseId];
          const seed = {
            courseId,
            lessonsCompleted: existing?.lessonsCompleted ?? [],
            currentLessonId: lesson.id,
            percentComplete: Math.max(existing?.percentComplete ?? 0, 1),
            updatedAt: new Date(),
          };
          useProgressStore.getState().setProgress(courseId, seed);
          const uid = auth.currentUser?.uid;
          if (uid) {
            void saveProgressToFirestore(uid, seed);
          }
        }

        // Auto-completar la lección cuando el video llega al 95%.
        if (lesson && d > 0 && ct / d >= 0.95 && !autoCompletedRef.current.has(lesson.id)) {
          autoCompletedRef.current.add(lesson.id);
          handleCompleteRef.current();
        }
      } catch {
        /* noop */
      }
    }, 300);
    return () => clearInterval(interval);
  }, [player, aspect, lesson, route.params.courseId, markCourseStarted]);

  const moduleIndex = useMemo(() => {
    if (!lesson) return 0;
    const m = modules.find((mod) => mod.id === lesson.moduleId);
    if (!m) return 0;
    const sorted = [...modules].sort((a, b) => a.order - b.order);
    return sorted.findIndex((x) => x.id === m.id) + 1;
  }, [lesson, modules]);
  const moduleName = useMemo(() => {
    if (!lesson) return '';
    return modules.find((mod) => mod.id === lesson.moduleId)?.title || '';
  }, [lesson, modules]);

  const togglePlay = () => {
    try {
      if (player.playing) player.pause();
      else player.play();
    } catch {
      /* ignore */
    }
  };

  const onSeek = (pct: number) => {
    if (!duration) return;
    try {
      player.currentTime = duration * pct;
    } catch {
      /* ignore */
    }
  };

  const trackRef = useRef<View>(null);
  const onTrackPress = (event: { nativeEvent: { locationX: number } }) => {
    if (!trackRef.current) return;
    trackRef.current.measure((_x, _y, width) => {
      if (width > 0) {
        const x = event.nativeEvent.locationX;
        onSeek(Math.max(0, Math.min(1, x / width)));
      }
    });
  };

  const handleComplete = () => {
    if (!lesson) return;
    if (busyRef.current) return;
    busyRef.current = true;
    setTimeout(() => {
      busyRef.current = false;
    }, 600);

    const courseId = route.params.courseId;
    const previouslyCompleted = courseProgress?.lessonsCompleted ?? [];
    const wasCompleted = previouslyCompleted.includes(lesson.id);
    const updated = localProgressUpdate(courseProgress, courseId, lesson.id, totalLessons);

    const moduleDone = isModuleJustCompleted(
      modules,
      lessons,
      courseProgress,
      lesson.id,
      previouslyCompleted,
    );
    const justFinishedCourse = updated.percentComplete >= 100;

    markLessonComplete(courseId, lesson.id, totalLessons);
    useProgressStore.getState().setProgress(courseId, updated);

    if (justFinishedCourse && !wasCompleted) {
      setCourseModal(true);
    } else if (moduleDone.completed && !wasCompleted) {
      setModuleModal({ title: moduleDone.moduleTitle });
    } else {
      const idx = lessons.findIndex((l) => l.id === lesson.id);
      const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
      if (next) {
        navigation.setParams({ lessonId: next.id });
      } else {
        navigation.goBack();
      }
    }

    void (async () => {
      try {
        await completeLesson(courseId, lesson.id, updated);
        if (!wasCompleted) {
          await awardLessonCompletion(courseId, lesson.id);
          await refreshUserProfile();
        }
      } catch {
        /* ignore network errors – local state already updated */
      }
    })();
  };

  // Mantener handleCompleteRef apuntando a la última versión de la función
  // (closures sobre lesson/courseProgress/etc cambian en cada render).
  useEffect(() => {
    handleCompleteRef.current = handleComplete;
  });

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

  const progressPct = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const lessonLinks = lesson.links ?? [];
  const hasResources = lessonLinks.length > 0 || Boolean(lesson.pdfUrl);

  return (
    <View style={styles.screen}>
      <AppBackground variant="default" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.topBtn} accessibilityLabel="Cerrar">
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.topChip}>
            <Text style={styles.topChipText} numberOfLines={1}>
              Módulo {moduleIndex || 1} de {modules.length || 1}
              {moduleName ? ` · ${moduleName}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => setListOpen(true)}
            style={styles.topBtn}
            accessibilityLabel="Más opciones"
          >
            <Ionicons name="ellipsis-vertical" size={18} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.stage}>
          <Pressable onPress={togglePlay} style={styles.videoTouch}>
            <VideoView
              key={lesson.id}
              player={player}
              style={styles.video}
              nativeControls={false}
              contentFit="contain"
              fullscreenOptions={{ enable: true }}
            />
            <View pointerEvents="none" style={styles.centerOverlay}>
              <View style={styles.playCircle}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={36}
                  color={Colors.textPrimary}
                  style={isPlaying ? undefined : styles.playIcon}
                />
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.bottom}>
          <Pressable ref={trackRef} onPress={onTrackPress} style={styles.track}>
            <View style={styles.trackBg} />
            <View style={[styles.trackFill, { width: `${progressPct * 100}%` }]} />
            <View style={[styles.trackDot, { left: `${progressPct * 100}%` }]} />
          </Pressable>

          <View style={styles.timesRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.controlsLeft}>
              <Pressable style={styles.flatControl} accessibilityLabel="Velocidad">
                <Text style={styles.flatControlText}>1x</Text>
              </Pressable>
              <Pressable style={styles.flatControl} accessibilityLabel="Subtítulos">
                <Ionicons name="text" size={18} color={Colors.textPrimary} />
              </Pressable>
              <Pressable
                style={styles.flatControl}
                accessibilityLabel="Recursos del módulo"
                onPress={() => setResourcesOpen(true)}
              >
                <Ionicons name="link-outline" size={18} color={Colors.textPrimary} />
                {hasResources ? <View style={styles.resourceDot} /> : null}
              </Pressable>
            </View>
            <View style={styles.completeBadge}>
              <Ionicons name="sparkles" size={15} color={Colors.accentHighlight} />
              <Text style={styles.completeBadgeText}>+{LESSON_COINS} al completar</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        transparent
        animationType="slide"
        visible={listOpen}
        onRequestClose={() => setListOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setListOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 20 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Módulos del curso ({lessons.length})</Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {lessons.map((item) => {
                const done = courseProgress?.lessonsCompleted.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.sheetRow, item.id === lesson.id && styles.sheetRowActive]}
                    onPress={() => {
                      setListOpen(false);
                      navigation.setParams({ lessonId: item.id });
                    }}
                  >
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'play-circle-outline'}
                      size={22}
                      color={done ? Colors.accentHighlight : Colors.textTertiary}
                    />
                    <Text style={styles.sheetRowText} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <LessonResourcesSheet
        visible={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
        links={lessonLinks}
        pdfUrl={lesson.pdfUrl}
      />

      <ModuleCompleteModal
        visible={moduleModal != null}
        moduleTitle={moduleModal?.title}
        progressPercent={courseProgress?.percentComplete ?? 0}
        streakDelta={1}
        onContinue={continueAfterModule}
        onBackHome={() => {
          setModuleModal(null);
          navigation.goBack();
        }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  safe: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 12,
  },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF1F',
    borderWidth: 1,
    borderColor: '#FFFFFF2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topChip: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    alignItems: 'center',
  },
  topChipText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 12.5,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  videoTouch: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF26',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 4,
  },
  bottom: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 18,
    gap: 8,
  },
  track: {
    height: 18,
    justifyContent: 'center',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF26',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.accentHighlight,
  },
  trackDot: {
    position: 'absolute',
    top: 1,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: Colors.textPrimary,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  flatControl: {
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flatControlText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  resourceDot: {
    position: 'absolute',
    top: 2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentHighlight,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  completeBadgeText: {
    color: Colors.accentHighlight,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#FFFFFF33',
    marginBottom: 6,
  },
  sheetTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#1F0A40',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  sheetRowActive: {
    borderColor: Colors.accentPrimary,
  },
  sheetRowText: {
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '600',
  },
});
