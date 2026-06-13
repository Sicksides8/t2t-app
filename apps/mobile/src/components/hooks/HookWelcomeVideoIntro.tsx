import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getWelcomeVideoUrl } from '../../constants/media';
import { Colors, Typography } from '../../theme';

type Props = {
  durationLabel: string;
  scriptLine: string;
  headline: string;
  authorName: string;
  authorRole: string;
  videoUrl?: string;
  skipLabel: string;
  onSkip: () => void;
};

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function HookWelcomeVideoIntro({
  durationLabel,
  scriptLine,
  headline,
  authorName,
  authorRole,
  videoUrl,
  skipLabel,
  onSkip,
}: Props) {
  const source = videoUrl?.startsWith('http') ? videoUrl : getWelcomeVideoUrl();
  const [started, setStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const trackRef = useRef<View>(null);
  const videoViewRef = useRef<VideoView>(null);

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.pause();
  });

  // Sync isPlaying / currentTime / duration desde el player.
  // Mismo patrón que VideoPlayerScreen: poll cada 300ms — el SDK no
  // expone un listener de tiempo confiable cross-platform.
  useEffect(() => {
    if (!started) return undefined;
    const interval = setInterval(() => {
      try {
        setIsPlaying(player.playing);
        setCurrentTime(player.currentTime || 0);
        if (player.duration && player.duration > 0) setDuration(player.duration);
      } catch {
        /* noop */
      }
    }, 300);
    return () => clearInterval(interval);
  }, [player, started]);

  const play = () => {
    setStarted(true);
    player.play();
  };

  const togglePlay = () => {
    try {
      if (player.playing) player.pause();
      else player.play();
    } catch {
      /* noop */
    }
  };

  const onSeek = (pct: number) => {
    if (!duration) return;
    try {
      player.currentTime = duration * pct;
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
    void videoViewRef.current?.enterFullscreen().catch(() => {
      /* el ref puede no estar listo o el OS rechazar */
    });
  };

  const progressPct = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.durationChip}>
          <Ionicons name="videocam" size={14} color={Colors.accentHighlight} />
          <Text style={styles.durationText}>{durationLabel}</Text>
        </View>
        <Pressable onPress={onSkip} accessibilityRole="button" hitSlop={8} style={styles.skipBtn}>
          <Text style={styles.skipText}>{skipLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.accentHighlight} />
        </Pressable>
      </View>

      {!started ? (
        // Pre-play: orb circular con identidad visual del onboarding.
        <View style={styles.orbStage}>
          <View style={styles.haloOuter} />
          <View style={styles.haloMid} />
          <View style={styles.orb}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reproducir video de bienvenida"
              onPress={play}
              style={styles.playOverlay}
            >
              <LinearGradient
                colors={['#B73CEF', '#7A22B5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playCircle}
              >
                <Ionicons name="play" size={32} color={Colors.textPrimary} style={styles.playIcon} />
              </LinearGradient>
              <Text style={styles.placeholder}>[Video]</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // Post-play: stage 16:9 con controles custom (play/pause, track, tiempo, fullscreen).
        <View style={styles.playerShell}>
          <Pressable onPress={togglePlay} style={StyleSheet.absoluteFill}>
            <VideoView
              ref={videoViewRef}
              player={player}
              style={StyleSheet.absoluteFill}
              nativeControls={false}
              contentFit="cover"
              fullscreenOptions={{ enable: true }}
            />
            <View pointerEvents="none" style={styles.centerOverlay}>
              <View style={styles.centerPlay}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={28}
                  color={Colors.textPrimary}
                  style={isPlaying ? undefined : styles.centerPlayIcon}
                />
              </View>
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel="Pantalla completa"
            onPress={enterFullscreen}
            style={styles.fullscreenBtn}
          >
            <Ionicons name="expand" size={16} color={Colors.textPrimary} />
          </Pressable>

          <View style={styles.controlsBar} pointerEvents="box-none">
            <Pressable ref={trackRef} onPress={onTrackPress} style={styles.track}>
              <View style={styles.trackBg} />
              <View style={[styles.trackFill, { width: `${progressPct * 100}%` }]} />
              <View style={[styles.trackDot, { left: `${progressPct * 100}%` }]} />
            </Pressable>
            <View style={styles.timesRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.script}>{scriptLine}</Text>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.author}>
          {authorName} · {authorRole}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 20,
    paddingTop: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF14',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
  },
  durationText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF10',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
  },
  skipText: {
    color: Colors.accentHighlight,
    fontWeight: '700',
    fontSize: 13,
  },
  orbStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  haloOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#B73CEF20',
  },
  haloMid: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#B73CEF40',
  },
  orb: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#1F0A40',
    borderWidth: 2,
    borderColor: '#B73CEF55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B73CEF',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 4,
  },
  placeholder: {
    color: '#FFFFFF66',
    fontSize: 11,
    fontWeight: '600',
  },
  playerShell: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#B73CEF55',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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
  centerPlayIcon: {
    marginLeft: 3,
  },
  fullscreenBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
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
  infoCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
    gap: 6,
  },
  script: {
    fontFamily: 'DreamingOutloud',
    color: Colors.accentHighlight,
    fontSize: 22,
  },
  headline: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  author: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 4,
  },
});
