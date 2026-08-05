import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CelebrationModal,
  LessonResourcesSheet,
  ModuleCompleteModal,
  StreakMilestoneModal,
  VideoSettingsSheet,
  VideoSubtitleOverlay,
  type VideoSettingsOption,
} from '../../components/academy';
import { ScreenWrapper } from '../../components/ui';
import {
  applyLessonPlayerStreaming,
  getLessonVideoSourceUri,
  loadLessonIntoPlayer,
} from '../../utils/videoStreamConfig';
import { useSubtitles } from '../../hooks/useSubtitles';
import { auth } from '../../services/firebase';
import { getLessons } from '../../services/academyService';
import { fetchCourseById } from '../../services/courseService';
import {
  awardCourseAchievement,
  awardCourseCompletion,
  awardLessonCompletion,
  COURSE_COINS,
  LESSON_COINS,
} from '../../services/gamificationService';
import {
  completeLesson,
  enrollInCourse,
  localProgressUpdate,
  markSkillImpactApplied,
  saveProgressToFirestore,
} from '../../services/progressService';
import { saveDiagnosticResult } from '../../services/diagnosticService';
import { recordActivity } from '../../services/streakService';
import { scheduleStreakReminder } from '../../services/streakReminder';
import { applyCourseSkillImpact } from '../../utils/applyCourseSkillImpact';
import { exportCertificatePdf } from '../../utils/exportCertificate';
import {
  useAcademyStore,
  useAuthStore,
  usePreferencesStore,
  useProgressStore,
  VIDEO_PLAYBACK_RATES,
} from '../../stores';
import { getNextLesson, resolveActiveLesson } from '../../utils/moduleProgress';
import { formatLessonChipLabel, formatLessonTitle } from '../../utils/lessonDisplay';
import { buildWatchProgressUpdate, hasMeaningfulWatchTime } from '../../utils/courseProgress';
import {
  canTrustPlaybackComplete,
  isPartialStreamDuration,
} from '../../utils/videoCompletionGuard';
import {
  applyPlaybackRate,
  clampTimelineTime,
  isVideoTimelineComplete,
  normalizePlaybackProgress,
  PLAYBACK_RATE_SETTLE_MS,
} from '../../utils/videoPlayback';
import { canAccessLesson } from '../../utils/subscriptionAccess';
import { Colors, Spacing } from '../../theme';
import type { Course, Lesson, RootStackParamList } from '../../types';

type LessonCompleteState = {
  lessonTitle: string;
  nextLessonId?: string;
  nextLessonTitle?: string;
  hasNextLesson: boolean;
  progressPercent: number;
  streakDelta: number;
};

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function formatRate(rate: number): string {
  // 1 -> "1x", 1.25 -> "1.25x"
  return `${Number.isInteger(rate) ? rate.toFixed(0) : rate.toString()}x`;
}

type VideoAspect = 'portrait' | 'landscape' | 'unknown';

const CHROME_AUTO_HIDE_MS = 4000;

export function VideoPlayerScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'VideoPlayer'>) {
  const markLessonComplete = useAcademyStore((state) => state.markLessonComplete);
  const markCourseStarted = useAcademyStore((state) => state.markCourseStarted);
  const updateWatchProgress = useAcademyStore((state) => state.updateWatchProgress);
  const progressMap = useAcademyStore((state) => state.progress);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const user = useAuthStore((state) => state.user);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [listOpen, setListOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [courseModal, setCourseModal] = useState(false);
  const [lessonCompleteModal, setLessonCompleteModal] = useState<LessonCompleteState | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<{ days: number; bonus: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerStatus, setPlayerStatus] = useState<'idle' | 'loading' | 'readyToPlay' | 'error'>('idle');
  const [hasMediaLoaded, setHasMediaLoaded] = useState(false);
  const [bufferedPosition, setBufferedPosition] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [aspect, setAspect] = useState<VideoAspect>('unknown');
  const [speedSheetOpen, setSpeedSheetOpen] = useState(false);
  const [subsSheetOpen, setSubsSheetOpen] = useState(false);
  const playbackRate = usePreferencesStore((s) => s.videoPlaybackRate);
  const subtitleLang = usePreferencesStore((s) => s.videoSubtitleLang);
  const setVideoPlaybackRate = usePreferencesStore((s) => s.setVideoPlaybackRate);
  const setVideoSubtitleLang = usePreferencesStore((s) => s.setVideoSubtitleLang);
  const hydratePreferences = usePreferencesStore((s) => s.hydrate);
  const insets = useSafeAreaInsets();
  const busyRef = useRef(false);
  const startedRef = useRef(false);
  const enrolledRef = useRef(false);
  const lastSavedPercentRef = useRef(0);
  const totalLessonsRef = useRef(1);
  const autoCompletedRef = useRef<Set<string>>(new Set());
  const blockAutoCompleteRef = useRef(false);
  const playbackRateRef = useRef(playbackRate);
  const rateSettlingRef = useRef(false);
  const rateSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lessonRef = useRef<Lesson | null>(null);
  const courseIdRef = useRef(route.params.courseId);
  const pendingPlayRef = useRef(false);
  const sourceLoadGenRef = useRef(0);
  const partialReloadLessonRef = useRef<string | null>(null);
  const resumeTimeByLessonRef = useRef<Record<string, number>>({});
  const videoViewRef = useRef<VideoView>(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        void NavigationBar.setVisibilityAsync('hidden');
      }
      return () => {
        if (Platform.OS === 'android') {
          void NavigationBar.setVisibilityAsync('visible');
        }
      };
    }, []),
  );

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    courseIdRef.current = route.params.courseId;
  }, [route.params.courseId]);

  useEffect(() => {
    autoCompletedRef.current.clear();
    enrolledRef.current = false;
    busyRef.current = false;
    startedRef.current = false;
  }, [route.params.courseId]);

  useEffect(() => {
    lastSavedPercentRef.current = progressMap[route.params.courseId]?.percentComplete ?? 0;
  }, [route.params.courseId, progressMap]);

  useEffect(() => {
    blockAutoCompleteRef.current = lessonCompleteModal != null || courseModal;
  }, [lessonCompleteModal, courseModal]);

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  const activeLessonId = route.params.lessonId;

  useEffect(() => {
    if (route.params.lessonId || lessons.length === 0) return;
    const firstPending =
      lessons.find((l) => !progressMap[route.params.courseId]?.lessonsCompleted.includes(l.id)) ??
      lessons[0];
    if (firstPending) {
      navigation.setParams({ lessonId: firstPending.id });
    }
  }, [lessons, route.params.courseId, route.params.lessonId, progressMap, navigation]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [remoteLessons, remoteCourse] = await Promise.all([
        getLessons(route.params.courseId),
        fetchCourseById(route.params.courseId),
      ]);
      if (!cancelled) {
        setLessons([...remoteLessons].sort((a, b) => a.order - b.order));
        setCourse(remoteCourse ?? null);
        if (remoteCourse?.title) setCourseTitle(remoteCourse.title);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params.courseId]);

  const lesson = useMemo(
    () => (activeLessonId ? resolveActiveLesson(lessons, activeLessonId) : null),
    [lessons, activeLessonId],
  );

  useEffect(() => {
    lessonRef.current = lesson;
  }, [lesson]);

  /**
   * Gating defensivo: si el user llega al VideoPlayer (deep link, error de UX,
   * cambio de plan) sin acceso a la lección, lo devolvemos al CourseDetail
   * donde el `PaywallModal` está cableado al play.
   *
   * TODO MERCADOPAGO: cuando exista la pasarela real, este flujo puede
   * abrir el paywall inline en vez de hacer replace.
   */
  useEffect(() => {
    if (!course || !lesson) return;
    if (canAccessLesson(lesson, course, user)) return;
    navigation.replace('CourseDetail', { courseId: course.id });
  }, [course, lesson, user, navigation]);

  const totalLessons = lessons.length || 1;
  const courseProgress = progressMap[route.params.courseId];
  const completedBefore = lesson ? courseProgress?.lessonsCompleted.includes(lesson.id) : false;

  useEffect(() => {
    totalLessonsRef.current = totalLessons;
  }, [totalLessons]);

  const videoSourceUri = lesson ? getLessonVideoSourceUri(lesson.videoUrl) : '';
  const hasVideoSource = Boolean(videoSourceUri);
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = false;
    instance.pause();
    try {
      applyLessonPlayerStreaming(instance);
      applyPlaybackRate(instance, playbackRateRef.current);
    } catch {
      /* noop */
    }
  });

  const isInitialVideoLoading =
    hasVideoSource &&
    !hasMediaLoaded &&
    (playerStatus === 'loading' || playerStatus === 'idle');
  const isSeekBuffering = hasMediaLoaded && playerStatus === 'loading';
  const isVideoReady = !hasVideoSource || playerStatus === 'readyToPlay';

  useEffect(() => {
    if (!isPlaying || isInitialVideoLoading || playerStatus === 'error') {
      setChromeVisible(true);
      return undefined;
    }
    const timer = setTimeout(() => setChromeVisible(false), CHROME_AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, isInitialVideoLoading, playerStatus, lesson?.id]);

  useEffect(() => {
    setPlayerStatus(player.status);
    const subscription = player.addListener('statusChange', ({ status, error }) => {
      setPlayerStatus(status);
      if (status === 'readyToPlay') {
        setHasMediaLoaded(true);
      }
      if (status === 'error' && __DEV__) {
        console.warn('[VideoPlayer] status error:', error);
      }
    });
    return () => {
      try {
        subscription.remove();
      } catch {
        /* noop */
      }
    };
  }, [player]);

  const applyRateWithSettle = useCallback(
    (rate: number) => {
      rateSettlingRef.current = true;
      if (rateSettleTimerRef.current) {
        clearTimeout(rateSettleTimerRef.current);
      }
      try {
        applyPlaybackRate(player, rate);
      } catch {
        /* noop */
      }
      rateSettleTimerRef.current = setTimeout(() => {
        rateSettlingRef.current = false;
        rateSettleTimerRef.current = null;
      }, PLAYBACK_RATE_SETTLE_MS);
    },
    [player],
  );

  useEffect(() => {
    applyRateWithSettle(playbackRate);
  }, [applyRateWithSettle, playbackRate, lesson?.id]);

  useEffect(
    () => () => {
      if (rateSettleTimerRef.current) {
        clearTimeout(rateSettleTimerRef.current);
      }
    },
    [],
  );

  // Resolución del track de subtítulo activo y carga del .vtt asociado.
  const subtitleTracks = lesson?.subtitles ?? [];
  const activeSubtitleTrack =
    subtitleLang ? subtitleTracks.find((t) => t.lang === subtitleLang) ?? null : null;
  const { activeCue: activeSubtitleCue } = useSubtitles(
    activeSubtitleTrack?.url ?? null,
    currentTime,
  );

  useEffect(() => {
    if (!lesson?.id) return;

    partialReloadLessonRef.current = null;
    if (lesson.id) {
      autoCompletedRef.current.delete(lesson.id);
    }
    busyRef.current = false;
    pendingPlayRef.current = false;
    setAspect('unknown');
    startedRef.current = false;
    rateSettlingRef.current = false;
    if (rateSettleTimerRef.current) {
      clearTimeout(rateSettleTimerRef.current);
      rateSettleTimerRef.current = null;
    }
    setCurrentTime(0);
    setDuration(0);
    setBufferedPosition(0);
    setHasMediaLoaded(false);
    setChromeVisible(true);
    setIsPlaying(false);
    try {
      player.pause();
      player.currentTime = 0;
    } catch {
      /* noop */
    }

    if (!videoSourceUri || !lesson) {
      setPlayerStatus('idle');
      return;
    }

    const loadGen = sourceLoadGenRef.current + 1;
    sourceLoadGenRef.current = loadGen;
    setPlayerStatus('loading');

    void (async () => {
      const result = await loadLessonIntoPlayer(player, lesson.videoUrl);
      if (sourceLoadGenRef.current !== loadGen) return;

      if (result === 'failed') {
        setPlayerStatus('error');
        return;
      }

      try {
        applyPlaybackRate(player, playbackRateRef.current);
        const savedResume = resumeTimeByLessonRef.current[lesson.id];
        const alreadyDone = progressMap[route.params.courseId]?.lessonsCompleted.includes(lesson.id);
        if (
          savedResume &&
          savedResume > 2 &&
          !alreadyDone &&
          lesson.durationSec > 0 &&
          savedResume < lesson.durationSec * 0.95
        ) {
          player.currentTime = savedResume;
          setCurrentTime(savedResume);
        }
      } catch {
        /* noop */
      }
    })();

    return () => {
      try {
        const currentLesson = lessonRef.current;
        const ct = player.currentTime;
        if (currentLesson?.id && ct > 5) {
          resumeTimeByLessonRef.current[currentLesson.id] = ct;
        }
      } catch {
        /* noop */
      }
    };
  }, [lesson?.id, lesson?.videoUrl, videoSourceUri, player, route.params.courseId, progressMap]);

  useEffect(() => {
    if (playerStatus !== 'readyToPlay' || !pendingPlayRef.current) return;

    pendingPlayRef.current = false;
    try {
      const d = player.duration > 0 ? player.duration : 0;
      const ct = d > 0 ? clampTimelineTime(player.currentTime || 0, d) : 0;
      if (d > 0 && isVideoTimelineComplete(ct, d)) {
        player.currentTime = 0;
        setCurrentTime(0);
      }
      player.play();
    } catch {
      setIsPlaying(false);
    }
  }, [playerStatus, player]);

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

  const handleCompleteRef = useRef<() => void>(() => {});
  const progressMapRef = useRef(progressMap);
  const tryAutoCompleteRef = useRef<(currentTime: number, duration: number) => void>(() => {});

  useEffect(() => {
    progressMapRef.current = progressMap;
  }, [progressMap]);

  const syncWatchProgress = useCallback(
    (currentTime: number, duration: number) => {
      const currentLesson = lessonRef.current;
      const courseId = courseIdRef.current;
      if (!currentLesson || duration <= 0) return;

      if (!startedRef.current) {
        startedRef.current = true;
        markCourseStarted(courseId, currentLesson.id);
      }
      if (!enrolledRef.current) {
        enrolledRef.current = true;
        void enrollInCourse(courseId);
      }

      if (!hasMeaningfulWatchTime(currentTime, duration)) return;

      updateWatchProgress(courseId, currentLesson.id, currentTime, duration, totalLessonsRef.current);
      const existing = progressMapRef.current[courseId];
      const patched = buildWatchProgressUpdate(
        existing,
        courseId,
        currentLesson.id,
        totalLessonsRef.current,
        currentTime,
        duration,
      );
      if (patched && patched.percentComplete > lastSavedPercentRef.current) {
        lastSavedPercentRef.current = patched.percentComplete;
        useProgressStore.getState().setProgress(courseId, patched);
        const uid = auth.currentUser?.uid;
        if (uid) {
          void saveProgressToFirestore(uid, patched);
        }
      }
    },
    [markCourseStarted, updateWatchProgress],
  );

  const finalizeAtEnd = useCallback(
    (duration: number) => {
      if (duration > 0) {
        setCurrentTime(duration);
        setDuration(duration);
      }
      setIsPlaying(false);
      try {
        player.pause();
      } catch {
        /* noop */
      }
    },
    [player],
  );

  const tryAutoComplete = useCallback(
    (currentTime: number, duration: number) => {
      const currentLesson = lessonRef.current;
      if (!currentLesson || blockAutoCompleteRef.current || rateSettlingRef.current) return;
      if (autoCompletedRef.current.has(currentLesson.id)) return;
      if (!canTrustPlaybackComplete(currentTime, duration, currentLesson.durationSec)) return;

      autoCompletedRef.current.add(currentLesson.id);
      finalizeAtEnd(duration);
      handleCompleteRef.current();
    },
    [finalizeAtEnd],
  );

  useEffect(() => {
    tryAutoCompleteRef.current = tryAutoComplete;
  }, [tryAutoComplete]);

  useEffect(() => {
    if (!lesson) return;

    const syncBufferedPosition = () => {
      try {
        const buffered = player.bufferedPosition;
        if (buffered >= 0) {
          setBufferedPosition(buffered);
        }
      } catch {
        /* noop */
      }
    };

    const syncTimelineUi = (rawCurrentTime: number) => {
      const d = player.duration > 0 ? player.duration : 0;
      const ct = d > 0 ? clampTimelineTime(rawCurrentTime, d) : Math.max(0, rawCurrentTime);
      setCurrentTime(ct);
      if (d > 0) setDuration(d);
      setIsPlaying(player.playing);
      syncBufferedPosition();
      return { ct, d };
    };

    const onTimeUpdate = (payload: { currentTime: number }) => {
      const { ct, d } = syncTimelineUi(payload.currentTime);
      if (player.playing && d > 0) {
        syncWatchProgress(ct, d);
      }
      if (!rateSettlingRef.current) {
        tryAutoCompleteRef.current(ct, d);
      }
    };

    const onPlayToEnd = () => {
      rateSettlingRef.current = false;
      const currentLesson = lessonRef.current;
      const d = player.duration > 0 ? player.duration : 0;
      finalizeAtEnd(d);

      if (!currentLesson || blockAutoCompleteRef.current) return;
      if (autoCompletedRef.current.has(currentLesson.id)) return;

      const ct = d > 0 ? clampTimelineTime(player.currentTime || 0, d) : 0;
      if (d > 0 && !isVideoTimelineComplete(ct, d)) return;

      autoCompletedRef.current.add(currentLesson.id);
      handleCompleteRef.current();
    };

    const onPlayingChange = (payload: { isPlaying: boolean }) => {
      setIsPlaying(payload.isPlaying);
      if (payload.isPlaying || rateSettlingRef.current) return;

      const d = player.duration > 0 ? player.duration : 0;
      const ct = d > 0 ? clampTimelineTime(player.currentTime || 0, d) : 0;
      setCurrentTime(ct);
      if (d > 0) setDuration(d);

      // Fallback en velocidades bajas: algunos dispositivos pausan sin emitir playToEnd.
      if (d > 0 && isVideoTimelineComplete(ct, d)) {
        tryAutoCompleteRef.current(ct, d);
      }
    };

    try {
      applyPlaybackRate(player, playbackRateRef.current);
    } catch {
      /* noop */
    }

    const subscriptions = [
      player.addListener('timeUpdate', onTimeUpdate),
      player.addListener('playToEnd', onPlayToEnd),
      player.addListener('playingChange', onPlayingChange),
    ];

    return () => {
      for (const subscription of subscriptions) {
        try {
          subscription.remove();
        } catch {
          /* noop */
        }
      }
    };
  }, [player, lesson?.id, syncWatchProgress, finalizeAtEnd]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        if (aspect !== 'unknown') return;
        const size = player.videoTrack?.size;
        if (size && size.width > 0 && size.height > 0) {
          setAspect(size.width >= size.height ? 'landscape' : 'portrait');
        }
      } catch {
        /* noop */
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player, aspect, lesson?.id]);

  const lessonIndex = useMemo(() => {
    if (!lesson) return 0;
    const idx = lessons.findIndex((l) => l.id === lesson.id);
    return idx >= 0 ? idx + 1 : 0;
  }, [lesson, lessons]);

  const togglePlay = () => {
    if (playerStatus === 'error') return;

    try {
      if (player.playing) {
        player.pause();
        pendingPlayRef.current = false;
        setIsPlaying(false);
        return;
      }

      if (isInitialVideoLoading || !isVideoReady) {
        pendingPlayRef.current = true;
        return;
      }

      const d = player.duration > 0 ? player.duration : duration;
      const ct = d > 0 ? clampTimelineTime(player.currentTime || currentTime, d) : 0;

      if (d > 0 && isVideoTimelineComplete(ct, d)) {
        player.currentTime = 0;
        setCurrentTime(0);
      }

      player.play();
    } catch {
      pendingPlayRef.current = false;
      setIsPlaying(false);
    }
  };

  const handleStagePress = () => {
    if (!chromeVisible && isPlaying) {
      setChromeVisible(true);
      return;
    }
    setChromeVisible(true);
    togglePlay();
  };

  const enterNativeFullscreen = () => {
    setChromeVisible(true);
    try {
      (player as unknown as { enterFullscreen?: () => void }).enterFullscreen?.();
    } catch {
      /* noop */
    }
  };

  const onSeek = (pct: number) => {
    if (!duration || isInitialVideoLoading) return;
    try {
      const nextTime = clampTimelineTime(duration * pct, duration);
      player.currentTime = nextTime;
      setCurrentTime(nextTime);
      try {
        const buffered = player.bufferedPosition;
        if (buffered >= 0) {
          setBufferedPosition(buffered);
        }
      } catch {
        /* noop */
      }
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

    const mediaDuration = player.duration > 0 ? player.duration : duration;
    const mediaTime = player.currentTime > 0 ? player.currentTime : currentTime;
    if (mediaDuration > 0 && !isVideoTimelineComplete(mediaTime, mediaDuration)) return;

    busyRef.current = true;
    setTimeout(() => {
      busyRef.current = false;
    }, 600);

    const courseId = route.params.courseId;
    const previouslyCompleted = courseProgress?.lessonsCompleted ?? [];
    const wasCompleted = previouslyCompleted.includes(lesson.id);
    const updated = localProgressUpdate(courseProgress, courseId, lesson.id, totalLessons);
    const nextLesson = getNextLesson(lessons, lesson.id);
    const justFinishedCourse = updated.percentComplete >= 100;

    try {
      player.pause();
      setIsPlaying(false);
      if (player.duration > 0) {
        setCurrentTime(player.duration);
        setDuration(player.duration);
      }
    } catch {
      /* noop */
    }

    if (wasCompleted) return;

    markLessonComplete(courseId, lesson.id, totalLessons);
    useProgressStore.getState().setProgress(courseId, updated);
    lastSavedPercentRef.current = updated.percentComplete;

    if (justFinishedCourse) {
      setCourseModal(true);
    } else {
      setLessonCompleteModal({
        lessonTitle: lesson.title,
        nextLessonId: nextLesson?.id,
        nextLessonTitle: nextLesson?.title,
        hasNextLesson: Boolean(nextLesson),
        progressPercent: updated.percentComplete,
        streakDelta: 0,
      });
    }

    void (async () => {
      try {
        await completeLesson(courseId, lesson.id, updated);
        const lessonCoins = await awardLessonCompletion(courseId, lesson.id);
        let latestCoins = lessonCoins;
        if (justFinishedCourse) {
          latestCoins = await awardCourseCompletion(courseId);
          await awardCourseAchievement(courseId, courseTitle || 'Curso T2T');
          if (course?.skillImpact && !courseProgress?.skillImpactApplied) {
            const diagnostic = useAcademyStore.getState().diagnostic;
            const updatedDiag = await applyCourseSkillImpact(
              course,
              diagnostic,
              saveDiagnosticResult,
            );
            if (updatedDiag) {
              useAcademyStore.getState().setDiagnostic(updatedDiag);
            }
            await markSkillImpactApplied(courseId);
            const flagged = { ...updated, skillImpactApplied: true };
            useProgressStore.getState().setProgress(courseId, flagged);
            const uid = auth.currentUser?.uid;
            if (uid) await saveProgressToFirestore(uid, flagged);
          }
        }
        const streak = await recordActivity();
        if (!justFinishedCourse) {
          setLessonCompleteModal((prev) =>
            prev ? { ...prev, streakDelta: streak.delta } : prev,
          );
        }
        if (streak.milestoneReached) {
          const { STREAK_MILESTONE_BONUS } = await import('../../services/streakService');
          setStreakMilestone({
            days: streak.milestoneReached,
            bonus: STREAK_MILESTONE_BONUS[streak.milestoneReached],
          });
        }
        await scheduleStreakReminder();
        // Siempre sincronizar perfil: antes solo se hacía si había delta de racha
        // y el balance de coins quedaba stale hasta reiniciar la app.
        const authState = useAuthStore.getState();
        if (authState.user) {
          authState.setUser({ ...authState.user, coins: latestCoins });
        }
        await refreshUserProfile();
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

  const continueAfterLesson = () => {
    const nextId = lessonCompleteModal?.nextLessonId;
    setLessonCompleteModal(null);
    busyRef.current = false;
    blockAutoCompleteRef.current = false;
    if (nextId) {
      navigation.setParams({ lessonId: nextId });
    } else {
      navigation.goBack();
    }
  };

  if (lessons.length === 0 || !lesson) {
    return (
      <ScreenWrapper>
        <ActivityIndicator color={Colors.accentPrimary} size="large" style={{ marginTop: Spacing.xxl }} />
      </ScreenWrapper>
    );
  }

  const progressPct = normalizePlaybackProgress(currentTime, duration);
  const bufferedPct = normalizePlaybackProgress(bufferedPosition, duration);
  const lessonLinks = lesson.links ?? [];
  const hasResources = lessonLinks.length > 0 || Boolean(lesson.pdfUrl);

  const speedOptions: VideoSettingsOption[] = VIDEO_PLAYBACK_RATES.map((rate) => ({
    id: String(rate),
    label: formatRate(rate),
    sublabel: rate === 1 ? 'Normal' : undefined,
  }));

  const subtitleOptions: VideoSettingsOption[] = [
    { id: 'off', label: 'Desactivado' },
    ...subtitleTracks.map((track) => ({
      id: track.lang,
      label: track.label || track.lang,
      sublabel: track.label && track.label !== track.lang ? track.lang.toUpperCase() : undefined,
    })),
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <View style={styles.videoLayer}>
        <VideoView
          ref={videoViewRef}
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
          onFullscreenExit={() => setChromeVisible(true)}
        />
        <Pressable
          onPress={handleStagePress}
          style={styles.videoTouch}
          disabled={playerStatus === 'error'}
        />
        {isInitialVideoLoading ? (
          <View pointerEvents="none" style={styles.centerOverlay}>
            <ActivityIndicator size="large" color={Colors.accentPrimary} />
            <Text style={styles.loadingText}>Cargando video…</Text>
          </View>
        ) : playerStatus === 'error' ? (
          <View pointerEvents="none" style={styles.centerOverlay}>
            <Ionicons name="alert-circle-outline" size={36} color={Colors.textPrimary} />
            <Text style={styles.loadingText}>No se pudo cargar el video</Text>
          </View>
        ) : isSeekBuffering ? (
          <View pointerEvents="none" style={styles.bufferingOverlay}>
            <ActivityIndicator size="small" color={Colors.textPrimary} />
            <Text style={styles.bufferingText}>Cargando tramo…</Text>
          </View>
        ) : !isPlaying ? (
          <View pointerEvents="none" style={styles.centerOverlay}>
            <View style={styles.playCircle}>
              <Ionicons
                name="play"
                size={36}
                color={Colors.textPrimary}
                style={styles.playIcon}
              />
            </View>
          </View>
        ) : null}
        <VideoSubtitleOverlay
          cue={activeSubtitleCue}
          bottomOffset={insets.bottom + (chromeVisible ? 168 : 56)}
        />
      </View>

      <View
        pointerEvents={chromeVisible ? 'box-none' : 'none'}
        style={[styles.chromeTop, !chromeVisible && styles.chromeHidden]}
      >
        <LinearGradient colors={['#000000CC', '#00000066', 'transparent']} style={styles.chromeGradient}>
          <View style={[styles.topRow, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => navigation.goBack()} style={styles.topBtn} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </Pressable>
            <View style={styles.topChip}>
              <Text style={styles.topChipText} numberOfLines={1}>
                {lessonIndex || 1} · {lesson.title}
              </Text>
            </View>
            <Pressable
              onPress={enterNativeFullscreen}
              style={styles.topBtn}
              accessibilityLabel="Pantalla completa"
            >
              <Ionicons name="expand" size={18} color={Colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => {
                setChromeVisible(true);
                setListOpen(true);
              }}
              style={styles.topBtn}
              accessibilityLabel="Más opciones"
            >
              <Ionicons name="ellipsis-vertical" size={18} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      <View
        pointerEvents={chromeVisible ? 'box-none' : 'none'}
        style={[styles.chromeBottom, !chromeVisible && styles.chromeHidden]}
      >
        <LinearGradient colors={['transparent', '#00000066', '#000000DD']} style={styles.chromeGradient}>
          <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            <Pressable ref={trackRef} onPress={onTrackPress} style={styles.track}>
              <View style={styles.trackBg} />
              <View style={[styles.trackBuffer, { width: `${bufferedPct * 100}%` }]} />
              <View style={[styles.trackFill, { width: `${progressPct * 100}%` }]} />
              <View style={[styles.trackDot, { left: `${progressPct * 100}%` }]} />
            </Pressable>

            <View style={styles.timesRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.controlsRow}>
              <View style={styles.controlsLeft}>
                <Pressable
                  style={styles.flatControl}
                  accessibilityLabel="Velocidad de reproducción"
                  onPress={() => {
                    setChromeVisible(true);
                    setSpeedSheetOpen(true);
                  }}
                >
                  <Text style={styles.flatControlText}>{formatRate(playbackRate)}</Text>
                </Pressable>
                <Pressable
                  style={[styles.flatControl, subtitleTracks.length === 0 && styles.flatControlDisabled]}
                  accessibilityLabel="Subtítulos"
                  accessibilityState={{ disabled: subtitleTracks.length === 0 }}
                  onPress={() => {
                    if (subtitleTracks.length === 0) return;
                    setChromeVisible(true);
                    setSubsSheetOpen(true);
                  }}
                >
                  <Ionicons
                    name="text"
                    size={18}
                    color={activeSubtitleTrack ? Colors.accentHighlight : Colors.textPrimary}
                  />
                  {activeSubtitleTrack ? <View style={styles.resourceDot} /> : null}
                </Pressable>
                <Pressable
                  style={styles.flatControl}
                  accessibilityLabel="Recursos del módulo"
                  onPress={() => {
                    setChromeVisible(true);
                    setResourcesOpen(true);
                  }}
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
        </LinearGradient>
      </View>

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
                      busyRef.current = false;
                      markCourseStarted(route.params.courseId, item.id);
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
        visible={lessonCompleteModal != null}
        moduleTitle={lessonCompleteModal?.lessonTitle}
        nextLessonTitle={lessonCompleteModal?.nextLessonTitle}
        hasNextLesson={lessonCompleteModal?.hasNextLesson ?? false}
        progressPercent={lessonCompleteModal?.progressPercent ?? courseProgress?.percentComplete ?? 0}
        streakDelta={lessonCompleteModal?.streakDelta ?? 0}
        onContinue={continueAfterLesson}
        onBackHome={() => {
          setLessonCompleteModal(null);
          busyRef.current = false;
          navigation.goBack();
        }}
        onClose={() => {
          setLessonCompleteModal(null);
          busyRef.current = false;
        }}
      />

      <StreakMilestoneModal
        visible={streakMilestone != null}
        days={streakMilestone?.days ?? 0}
        bonus={streakMilestone?.bonus ?? 0}
        onClose={() => setStreakMilestone(null)}
      />

      <CelebrationModal
        variant="course"
        visible={courseModal}
        title="¡Curso completado!"
        body="Desbloqueaste un hito importante en tu academia."
        coins={COURSE_COINS}
        primaryLabel="Ver mis cursos"
        secondaryLabel="Descargar certificado"
        icon="trophy"
        onPrimary={() => {
          setCourseModal(false);
          navigation.navigate('Main');
        }}
        onSecondary={() => {
          void exportCertificatePdf({
            userName: user?.displayName || 'Alumno T2T',
            courseTitle: courseTitle || 'Curso T2T',
            certificateId: user?.id ? `${user.id}_${route.params.courseId}` : undefined,
          });
        }}
        onClose={() => setCourseModal(false)}
      />

      <VideoSettingsSheet
        visible={speedSheetOpen}
        title="Velocidad de reproducción"
        options={speedOptions}
        selectedId={String(playbackRate)}
        onSelect={(id) => {
          const value = Number(id);
          if (!Number.isNaN(value)) {
            setVideoPlaybackRate(value);
            applyRateWithSettle(value);
          }
          setSpeedSheetOpen(false);
        }}
        onClose={() => setSpeedSheetOpen(false)}
      />

      <VideoSettingsSheet
        visible={subsSheetOpen}
        title="Subtítulos"
        options={subtitleOptions}
        selectedId={subtitleLang ?? 'off'}
        onSelect={(id) => {
          setVideoSubtitleLang(id === 'off' ? null : id);
          setSubsSheetOpen(false);
        }}
        emptyLabel="Esta lección aún no tiene subtítulos."
        onClose={() => setSubsSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  videoTouch: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  chromeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  chromeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  chromeHidden: {
    opacity: 0,
  },
  chromeGradient: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
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
    backgroundColor: '#00000055',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    alignItems: 'center',
  },
  topChipText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 12.5,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
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
  loadingText: {
    marginTop: 12,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
  },
  bufferingOverlay: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#00000088',
    borderWidth: 1,
    borderColor: '#FFFFFF22',
  },
  bufferingText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  bottom: {
    paddingHorizontal: 18,
    paddingTop: 28,
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
  trackBuffer: {
    position: 'absolute',
    left: 0,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF44',
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
  flatControlDisabled: {
    opacity: 0.4,
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
