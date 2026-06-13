import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressBar } from '../ui';
import { Colors, Spacing, Typography } from '../../theme';
import type { Course } from '../../types';

type Props = {
  course: Course;
  onPress: () => void;
  progressPercent?: number;
  compact?: boolean;
};

const MAGENTA_GRADIENT = ['#6E1AAE', '#C040EE'] as const;
const TEAL_GRADIENT = ['#0E5A52', '#34D6C2'] as const;

export function CourseCard({ course, onPress, progressPercent, compact }: Props) {
  const tileGradient: readonly [string, string] = course.isPremium
    ? TEAL_GRADIENT
    : MAGENTA_GRADIENT;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}
    >
      {course.thumbnail ? (
        <Image source={{ uri: course.thumbnail }} style={styles.tile} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={tileGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tile}
        />
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.meta}>
          {course.totalLessons} módulos · {course.durationMin} min
        </Text>
        {progressPercent != null && progressPercent > 0 ? (
          <View style={styles.progressWrap}>
            <ProgressBar value={progressPercent} />
            <Text style={styles.progressLabel}>{progressPercent}%</Text>
          </View>
        ) : null}
      </View>
      {course.isPremium ? (
        <View style={styles.lockChip}>
          <Ionicons name="lock-closed" size={14} color={Colors.textPrimary} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    marginBottom: Spacing.md,
  },
  cardCompact: {
    padding: Spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 13,
  },
  progressWrap: {
    marginTop: 4,
    gap: 4,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
  },
  lockChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF14',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
