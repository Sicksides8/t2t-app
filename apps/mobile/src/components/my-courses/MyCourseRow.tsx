import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressRing } from '../ui';
import { skills } from '../../data/academy';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import type { Course } from '../../types';

type Props = {
  course: Course;
  progressPercent: number;
  completed?: boolean;
  onContinue: () => void;
};

export function MyCourseRow({ course, progressPercent, completed, onContinue }: Props) {
  const skill = skills.find((s) => s.id === course.skillId);
  const gradStart = skill?.color ?? Colors.accentPrimary;
  const gradEnd = Colors.bgSurface;
  const cta = completed ? 'Repasar' : 'Continuar';

  return (
    <View style={styles.card}>
      {course.thumbnail ? (
        <Image source={{ uri: course.thumbnail }} style={styles.thumb} />
      ) : (
        <LinearGradient
          colors={[gradStart, gradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.thumb}
        />
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <View style={styles.actions}>
          <ProgressRing value={progressPercent} size={32} />
          <Pressable style={styles.cta} onPress={onContinue}>
            <Text style={styles.ctaText}>{cta}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const THUMB = 80;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 12,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 12,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cta: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentPrimary,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
