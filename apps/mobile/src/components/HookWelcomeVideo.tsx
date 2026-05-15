import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getWelcomeVideoUrl } from '../constants/media';
import { CardGlass } from './ui';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface HookWelcomeVideoProps {
  durationLabel: string;
  scriptLine: string;
  headline: string;
  authorName: string;
  authorRole: string;
  videoUrl?: string;
}

export function HookWelcomeVideo({
  durationLabel,
  scriptLine,
  headline,
  authorName,
  authorRole,
  videoUrl,
}: HookWelcomeVideoProps) {
  const source = videoUrl?.startsWith('http') ? videoUrl : getWelcomeVideoUrl();
  const [started, setStarted] = useState(false);

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.pause();
  });

  const play = () => {
    setStarted(true);
    player.play();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chipRow}>
        <View style={styles.durationChip}>
          <Ionicons name="videocam" size={14} color={Colors.accentSecondary} />
          <Text style={styles.durationText}>{durationLabel}</Text>
        </View>
      </View>

      <View style={styles.playerShell}>
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={started}
          contentFit="cover"
          fullscreenOptions={{ enable: true }}
        />
        {!started ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reproducir video de bienvenida"
            onPress={play}
            style={styles.playOverlay}
          >
            <View style={styles.playCircle}>
              <Ionicons name="play" size={36} color={Colors.textPrimary} style={styles.playIcon} />
            </View>
          </Pressable>
        ) : null}
        <View style={styles.videoGradient} pointerEvents="none" />
      </View>

      <CardGlass style={styles.infoCard}>
        <Text style={styles.scriptLine}>{scriptLine}</Text>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.author}>
          {authorName} · {authorRole}
        </Text>
      </CardGlass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF26',
  },
  durationText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  playerShell: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.cardLg,
    overflow: 'hidden',
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 8, 58, 0.35)',
  },
  playCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
  },
  playIcon: {
    marginLeft: 4,
  },
  videoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: 'transparent',
    // Capa suave inferior (sin linear-gradient nativo)
    opacity: 0.9,
    borderBottomLeftRadius: Radius.cardLg,
    borderBottomRightRadius: Radius.cardLg,
  },
  infoCard: {
    gap: Spacing.xs,
  },
  scriptLine: {
    fontFamily: 'System',
    fontSize: 22,
    color: Colors.accentSecondary,
    fontStyle: 'italic',
  },
  headline: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  author: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
});
