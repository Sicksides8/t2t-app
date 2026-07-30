import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubtitles } from '../../hooks/useSubtitles';
import { usePreferencesStore, VIDEO_PLAYBACK_RATES } from '../../stores';
import { Colors } from '../../theme';
import type { SubtitleTrack } from '../../types';
import {
  applyPlaybackRate,
  clampTimelineTime,
  normalizePlaybackProgress,
  PLAYBACK_RATE_SETTLE_MS,
} from '../../utils/videoPlayback';
import { applyLessonPlayerStreaming, loadLessonIntoPlayer } from '../../utils/videoStreamConfig';
import { VideoSettingsSheet, type VideoSettingsOption } from './VideoSettingsSheet';
import { VideoSubtitleOverlay } from './VideoSubtitleOverlay';

type Props = {
  videoUrl: string;
  subtitles?: SubtitleTrack[];
  contentFit?: 'cover' | 'contain';
  fullscreenOnStart?: boolean;
  autoPlay?: boolean;
  style?: ViewStyle;
};

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function formatRate(rate: number): string {
  return `${Number.isInteger(rate) ? rate.toFixed(0) : rate.toString()}x`;
}

/**
 * Reproductor embebido compartido (módulos, bienvenida, etc.) con controles,
 * velocidad y subtítulos alineados al VideoPlayerScreen de lecciones.
 */
export function AcademyVideoPlayer({
  videoUrl,
  subtitles = [],
  contentFit = 'contain',
  fullscreenOnStart = false,
  autoPlay = false,
  style,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPosition, setBufferedPosition] = useState(0);
  const [playerStatus, setPlayerStatus] = useState<'idle' | 'loading' | 'readyToPlay' | 'error'>('idle');
  const [hasMediaLoaded, setHasMediaLoaded] = useState(false);
  const [speedSheetOpen, setSpeedSheetOpen] = useState(false);
  const [subsSheetOpen, setSubsSheetOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const insets = useSafeAreaInsets();
  const playbackRate = usePreferencesStore((s) => s.videoPlaybackRate);
  const subtitleLang = usePreferencesStore((s) => s.videoSubtitleLang);
  const setVideoPlaybackRate = usePreferencesStore((s) => s.setVideoPlaybackRate);
  const setVideoSubtitleLang = usePreferencesStore((s) => s.setVideoSubtitleLang);
  const hydratePreferences = usePreferencesStore((s) => s.hydrate);

  const playbackRateRef = useRef(playbackRate);
  const rateSettlingRef = useRef(false);
  const rateSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPlayRef = useRef(false);
  const sourceLoadGenRef = useRef(0);
  const trackRef = useRef<View>(null);
  const videoViewRef = useRef<VideoView>(null);
  const fullscreenStartedRef = useRef(false);

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
    Boolean(videoUrl) && !hasMediaLoaded && (playerStatus === 'loading' || playerStatus === 'idle');
  const isSeekBuffering = hasMediaLoaded && playerStatus === 'loading';
  const isVideoReady = playerStatus === 'readyToPlay';

  const activeSubtitleTrack =
    subtitleLang ? subtitles.find((t) => t.lang === subtitleLang) ?? null : null;
  const { activeCue: activeSubtitleCue } = useSubtitles(
    activeSubtitleTrack?.url ?? null,
    currentTime,
  );

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    setPlayerStatus(player.status);
    const subscription = player.addListener('statusChange', ({ status }) => {
      setPlayerStatus(status);
      if (status === 'readyToPlay') {
        setHasMediaLoaded(true);
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
  }, [applyRateWithSettle, playbackRate, videoUrl]);

  useEffect(
    () => () => {
      if (rateSettleTimerRef.current) {
        clearTimeout(rateSettleTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    pendingPlayRef.current = false;
    fullscreenStartedRef.current = false;
    setIsFullscreen(false);
    setCurrentTime(0);
    setDuration(0);
    setBufferedPosition(0);
    setHasMediaLoaded(false);
    setIsPlaying(false);
    try {
      player.pause();
      player.currentTime = 0;
    } catch {
      /* noop */
    }

    if (!videoUrl) {
      setPlayerStatus('idle');
      return;
    }

    const loadGen = sourceLoadGenRef.current + 1;
    sourceLoadGenRef.current = loadGen;
    setPlayerStatus('loading');

    void (async () => {
      const result = await loadLessonIntoPlayer(player, videoUrl);
      if (sourceLoadGenRef.current !== loadGen) return;
      if (result === 'failed') {
        setPlayerStatus('error');
        return;
      }
      try {
        applyPlaybackRate(player, playbackRateRef.current);
      } catch {
        /* noop */
      }
    })();
  }, [player, videoUrl]);

  useEffect(() => {
    if (!autoPlay || playerStatus !== 'readyToPlay') return;
    if (pendingPlayRef.current) return;
    pendingPlayRef.current = true;
    try {
      player.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [autoPlay, playerStatus, player]);

  useEffect(() => {
    if (!fullscreenOnStart || !hasMediaLoaded || fullscreenStartedRef.current) return;
    fullscreenStartedRef.current = true;
    setIsFullscreen(true);
    try {
      player.play();
      setIsPlaying(true);
    } catch {
      /* noop */
    }
  }, [fullscreenOnStart, hasMediaLoaded, player]);

  useEffect(() => {
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
    };

    const subscriptions = [
      player.addListener('timeUpdate', (payload: { currentTime: number }) => {
        syncTimelineUi(payload.currentTime);
      }),
      player.addListener('playingChange', (payload: { isPlaying: boolean }) => {
        setIsPlaying(payload.isPlaying);
        if (!payload.isPlaying) {
          const d = player.duration > 0 ? player.duration : 0;
          const ct = d > 0 ? clampTimelineTime(player.currentTime || 0, d) : 0;
          setCurrentTime(ct);
          if (d > 0) setDuration(d);
        }
      }),
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
  }, [player, videoUrl]);

  const togglePlay = () => {
    if (playerStatus === 'error') return;
    try {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
        return;
      }
      if (isInitialVideoLoading || !isVideoReady) {
        pendingPlayRef.current = true;
        return;
      }
      const d = player.duration > 0 ? player.duration : duration;
      const ct = d > 0 ? clampTimelineTime(player.currentTime || currentTime, d) : 0;
      if (d > 0 && ct >= d - 0.5) {
        player.currentTime = 0;
        setCurrentTime(0);
      }
      player.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const onSeek = (pct: number) => {
    if (!duration || isInitialVideoLoading) return;
    try {
      const nextTime = clampTimelineTime(duration * pct, duration);
      player.currentTime = nextTime;
      setCurrentTime(nextTime);
    } catch {
      /* noop */
    }
  };

  const onTrackPress = (event: { nativeEvent: { locationX: number } }) => {
    if (!trackRef.current) return;
    trackRef.current.measure((_x, _y, width) => {
      if (width > 0) {
        const x = event.nativeEvent.locationX;
        onSeek(Math.max(0, Math.min(1, x / width)));
      }
    });
  };

  const enterFullscreen = () => {
    setIsFullscreen(true);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  const progressPct = normalizePlaybackProgress(currentTime, duration);
  const bufferedPct = normalizePlaybackProgress(bufferedPosition, duration);
  const fit = isFullscreen ? 'contain' : contentFit;
  const subtitleBottomOffset = isFullscreen ? insets.bottom + 120 : 88;

  const speedOptions: VideoSettingsOption[] = VIDEO_PLAYBACK_RATES.map((rate) => ({
    id: String(rate),
    label: formatRate(rate),
    sublabel: rate === 1 ? 'Normal' : undefined,
  }));

  const subtitleOptions: VideoSettingsOption[] = [
    { id: 'off', label: 'Desactivado' },
    ...subtitles.map((track) => ({
      id: track.lang,
      label: track.label || track.lang,
      sublabel: track.label && track.label !== track.lang ? track.lang.toUpperCase() : undefined,
    })),
  ];

  const renderStage = (stageFullscreen: boolean) => (
    <View style={stageFullscreen ? styles.fullscreenStage : styles.embeddedStage}>
      <VideoView
        ref={videoViewRef}
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={false}
        contentFit={fit}
      />
      <Pressable onPress={togglePlay} style={styles.touchLayer} />
      {isInitialVideoLoading ? (
        <View pointerEvents="none" style={styles.centerOverlay}>
          <ActivityIndicator size="large" color={Colors.accentPrimary} />
          <Text style={styles.loadingText}>Cargando video…</Text>
        </View>
      ) : playerStatus === 'error' ? (
        <View pointerEvents="none" style={styles.centerOverlay}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.textPrimary} />
          <Text style={styles.loadingText}>No se pudo cargar el video</Text>
        </View>
      ) : isSeekBuffering ? (
        <View pointerEvents="none" style={styles.centerOverlay}>
          <ActivityIndicator size="small" color={Colors.textPrimary} />
        </View>
      ) : !isPlaying ? (
        <View pointerEvents="none" style={styles.centerOverlay}>
          <View style={styles.centerPlay}>
            <Ionicons name="play" size={28} color={Colors.textPrimary} style={styles.playIcon} />
          </View>
        </View>
      ) : null}
      <VideoSubtitleOverlay cue={activeSubtitleCue} bottomOffset={subtitleBottomOffset} />

      {stageFullscreen ? (
        <Pressable
          accessibilityLabel="Salir de pantalla completa"
          onPress={exitFullscreen}
          style={[styles.fullscreenCloseBtn, { top: insets.top + 10 }]}
        >
          <Ionicons name="contract" size={18} color={Colors.textPrimary} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel="Pantalla completa"
          onPress={enterFullscreen}
          style={styles.fullscreenBtn}
        >
          <Ionicons name="expand" size={16} color={Colors.textPrimary} />
        </Pressable>
      )}

      <View
        style={[
          styles.controlsBar,
          stageFullscreen && { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
        pointerEvents="box-none"
      >
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
          <Pressable
            style={styles.flatControl}
            accessibilityLabel="Velocidad de reproducción"
            onPress={() => setSpeedSheetOpen(true)}
          >
            <Text style={styles.flatControlText}>{formatRate(playbackRate)}</Text>
          </Pressable>
          <Pressable
            style={[styles.flatControl, subtitles.length === 0 && styles.flatControlDisabled]}
            accessibilityLabel="Subtítulos"
            accessibilityState={{ disabled: subtitles.length === 0 }}
            onPress={() => {
              if (subtitles.length === 0) return;
              setSubsSheetOpen(true);
            }}
          >
            <Ionicons
              name="text"
              size={16}
              color={activeSubtitleTrack ? Colors.accentHighlight : Colors.textPrimary}
            />
            {activeSubtitleTrack ? <View style={styles.resourceDot} /> : null}
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <>
      {!isFullscreen ? <View style={[styles.shell, style]}>{renderStage(false)}</View> : null}

      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={exitFullscreen}
        statusBarTranslucent
      >
        <StatusBar style="light" hidden />
        <SafeAreaView style={styles.fullscreenRoot} edges={['left', 'right']}>
          {renderStage(true)}
        </SafeAreaView>
      </Modal>

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
        emptyLabel="Este video aún no tiene subtítulos."
        onClose={() => setSubsSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#B73CEF55',
  },
  embeddedStage: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenStage: {
    flex: 1,
    backgroundColor: '#000000',
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  centerPlay: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF26',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 3,
  },
  fullscreenBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0000007A',
    borderWidth: 1,
    borderColor: '#FFFFFF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    right: 14,
    zIndex: 3,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0000007A',
    borderWidth: 1,
    borderColor: '#FFFFFF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    zIndex: 3,
    gap: 4,
  },
  track: {
    height: 18,
    justifyContent: 'center',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF33',
  },
  trackBuffer: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF55',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.accentHighlight,
  },
  trackDot: {
    position: 'absolute',
    top: 4,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
    backgroundColor: Colors.textPrimary,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  timeText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textShadowColor: '#000000B3',
    textShadowRadius: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  flatControl: {
    minWidth: 40,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#0000007A',
    borderWidth: 1,
    borderColor: '#FFFFFF24',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  flatControlDisabled: {
    opacity: 0.45,
  },
  flatControlText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  resourceDot: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentHighlight,
  },
});
