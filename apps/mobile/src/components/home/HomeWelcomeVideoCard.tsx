import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WELCOME_VIDEO_CONTENT } from '../../constants/welcomeVideo';
import { Colors, Radius, Typography } from '../../theme';
import type { SubtitleTrack } from '../../types';
import { WelcomeVideoPlayer } from '../shared/WelcomeVideoPlayer';

type Props = {
  videoUrl?: string;
  subtitles?: SubtitleTrack[];
  onDismiss: () => void;
};

export function HomeWelcomeVideoCard({ videoUrl, subtitles, onDismiss }: Props) {
  const { homeTitle, scriptLine, headline, authorName, authorRole } = WELCOME_VIDEO_CONTENT;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.durationChip}>
          <Ionicons name="videocam" size={14} color={Colors.accentHighlight} />
          <Text style={styles.durationText}>{homeTitle}</Text>
        </View>
        <Pressable
          onPress={onDismiss}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Cerrar video de bienvenida"
          hitSlop={12}
        >
          <Ionicons name="close" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <WelcomeVideoPlayer
        videoUrl={videoUrl}
        subtitles={subtitles}
        compact
        fullscreenOnStart
      />

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
    gap: 14,
    marginBottom: 18,
    padding: 14,
    borderRadius: Radius.cardLg,
    backgroundColor: '#1F0A40AA',
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
    shadowColor: '#B73CEF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    gap: 4,
  },
  script: {
    fontFamily: 'DreamingOutloud',
    color: Colors.accentHighlight,
    fontSize: 20,
  },
  headline: {
    ...Typography.h2,
    fontSize: 17,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  author: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
});
