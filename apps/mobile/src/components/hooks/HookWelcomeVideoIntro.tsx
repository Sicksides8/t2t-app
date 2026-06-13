import React, { useState } from 'react';
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

      <View style={styles.orbStage}>
        <View style={styles.haloOuter} />
        <View style={styles.haloMid} />
        <View style={styles.orb}>
          {started ? (
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              nativeControls
              contentFit="cover"
              fullscreenOptions={{ enable: true }}
            />
          ) : (
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
          )}
        </View>
      </View>

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
