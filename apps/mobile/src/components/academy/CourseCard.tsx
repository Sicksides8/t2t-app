import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../ui';
import { SkillChip } from './SkillChip';
import { skills } from '../../data/academy';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import type { Course } from '../../types';

type Props = {
  course: Course;
  onPress: () => void;
  progressPercent?: number;
  compact?: boolean;
};

export function CourseCard({ course, onPress, progressPercent, compact }: Props) {
  const skill = skills.find((s) => s.id === course.skillId);
  const levelLabel =
    course.level === 'beginner' ? 'Principiante' : course.level === 'intermediate' ? 'Intermedio' : 'Avanzado';

  return (
    <Pressable onPress={onPress} style={[styles.card, compact && styles.cardCompact]}>
      <View style={[styles.icon, skill && { backgroundColor: skill.color }]}>
        <Ionicons name={course.isPremium ? 'lock-closed' : 'play'} color={Colors.textPrimary} size={22} />
      </View>
      <View style={styles.body}>
        {skill ? <SkillChip label={skill.name} color={skill.color} small /> : null}
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.meta}>
          {course.durationMin} min · {course.totalLessons} lecciones · {levelLabel}
        </Text>
        {progressPercent != null && progressPercent > 0 ? (
          <View style={styles.progressWrap}>
            <ProgressBar value={progressPercent} />
            <Text style={styles.progressLabel}>{progressPercent}%</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" color={Colors.textTertiary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.card,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: Spacing.md,
  },
  cardCompact: {
    padding: Spacing.md,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentPrimary,
  },
  body: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  meta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  progressWrap: {
    marginTop: Spacing.xs,
    gap: 4,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
  },
});
