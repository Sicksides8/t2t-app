import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { skills } from '../../data/academy';
import { Colors, Typography } from '../../theme';
import type { Course } from '../../types';

type Props = {
  course: Course;
  progressPercent: number;
  width?: number;
  onPress: () => void;
};

/** Tarjeta «Continuá viendo» alineada a Component/Card Continue (NUxQ7) en 52_Home. */
export function ContinueCourseCard({ course, progressPercent, width = 165, onPress }: Props) {
  const skill = skills.find((s) => s.id === course.skillId);
  const label = skill?.name ?? course.title;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={styles.thumbWrap}>
        {course.thumbnail ? (
          <Image source={{ uri: course.thumbnail }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[Colors.accentPrimary, Colors.bgSurface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.playWrap} pointerEvents="none">
          <Ionicons name="play" size={18} color={Colors.textPrimary} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {label}
        </Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[Colors.accentPrimary, Colors.accentTertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progressPercent))}%` }]}
            />
          </View>
          <Text style={styles.duration}>{course.durationMin} min</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
  thumbWrap: {
    width: '100%',
    height: 60,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    ...StyleSheet.absoluteFillObject,
  },
  playWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: '100%',
    gap: 6,
  },
  title: {
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
    color: Colors.textPrimary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.divider,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  duration: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
});
