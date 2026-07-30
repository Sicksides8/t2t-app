import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AcademyVideoPlayer } from '../academy/AcademyVideoPlayer';
import { getWelcomeVideoUrl } from '../../constants/media';
import { Colors } from '../../theme';
import type { SubtitleTrack } from '../../types';

type Props = {
  videoUrl?: string;
  subtitles?: SubtitleTrack[];
  compact?: boolean;
  /** Al tocar play, abre fullscreen pausado antes de reproducir. */
  fullscreenOnStart?: boolean;
};

export function WelcomeVideoPlayer({
  videoUrl,
  subtitles,
  compact = false,
  fullscreenOnStart = false,
}: Props) {
  const source = videoUrl?.startsWith('http') ? videoUrl : getWelcomeVideoUrl();
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <View style={[styles.orbStage, compact && styles.orbStageCompact]}>
        <View style={[styles.haloOuter, compact && styles.haloOuterCompact]} />
        <View style={[styles.haloMid, compact && styles.haloMidCompact]} />
        <View style={[styles.orb, compact && styles.orbCompact]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reproducir video de bienvenida"
            onPress={() => setStarted(true)}
            style={styles.playOverlay}
          >
            <LinearGradient
              colors={['#B73CEF', '#7A22B5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.playCircle, compact && styles.playCircleCompact]}
            >
              <Ionicons
                name="play"
                size={compact ? 24 : 32}
                color={Colors.textPrimary}
                style={styles.playIcon}
              />
            </LinearGradient>
            {!compact ? <Text style={styles.placeholder}>[Video]</Text> : null}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <AcademyVideoPlayer
      videoUrl={source}
      subtitles={subtitles}
      contentFit="cover"
      fullscreenOnStart={fullscreenOnStart}
      autoPlay={!fullscreenOnStart}
    />
  );
}

const styles = StyleSheet.create({
  orbStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  orbStageCompact: {
    paddingVertical: 8,
  },
  haloOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#B73CEF20',
  },
  haloOuterCompact: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  haloMid: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#B73CEF40',
  },
  haloMidCompact: {
    width: 160,
    height: 160,
    borderRadius: 80,
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
  orbCompact: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
  playCircleCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  playIcon: {
    marginLeft: 4,
  },
  placeholder: {
    color: '#FFFFFF66',
    fontSize: 11,
    fontWeight: '600',
  },
});
