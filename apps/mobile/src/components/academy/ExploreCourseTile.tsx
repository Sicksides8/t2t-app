import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { skills } from '../../data/academy';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import type { Course } from '../../types';

type Props = {
  course: Course;
  onPress: () => void;
  width?: number;
};

export function ExploreCourseTile({ course, onPress, width = 170 }: Props) {
  const skill = skills.find((s) => s.id === course.skillId);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={styles.thumbWrap}>
        {course.thumbnail ? (
          <Image source={{ uri: course.thumbnail }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbPlaceholder, skill && { backgroundColor: `${skill.color}33` }]}>
            <Ionicons name="play-circle" size={32} color={skill?.color ?? Colors.accentPrimary} />
          </View>
        )}
        {course.isPremium ? (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color={Colors.textPrimary} />
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {course.title}
      </Text>
      <Text style={styles.meta}>
        {course.durationMin} min · {course.totalLessons} lecciones
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  thumbWrap: {
    height: 96,
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
  },
  lockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },
});
