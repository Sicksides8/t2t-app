import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { skills } from '../../data/academy';
import { Colors } from '../../theme';
import type { Course } from '../../types';

type Props = {
  course: Course;
  onPress: () => void;
  width?: number;
  matchSkillName?: string;
  /**
   * Indica si el user actual NO tiene acceso al curso. Controla el candado.
   * Si es `undefined` se hace fallback a `course.isPremium`.
   */
  locked?: boolean;
};

export function ExploreCourseTile({
  course,
  onPress,
  width = 180,
  matchSkillName,
  locked,
}: Props) {
  const skill = skills.find((s) => s.id === course.skillId);
  const skillName = skill?.name?.toUpperCase() ?? 'CURSO';
  const showLock = locked ?? Boolean(course.isPremium);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={styles.thumbWrap}>
        {course.thumbnail ? (
          <Image source={{ uri: course.thumbnail }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['#6E1AAE', '#C040EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.thumbGradient}
          >
            <Text style={styles.thumbPlaceholderText}>[VIDEO THUMB]</Text>
          </LinearGradient>
        )}
        {matchSkillName ? (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText} numberOfLines={1}>
              {matchSkillName}
            </Text>
          </View>
        ) : null}
        {showLock ? (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color={Colors.textPrimary} />
          </View>
        ) : null}
      </View>
      <View style={styles.bottom}>
        <Text style={styles.kicker}>{skillName}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          Gustavo · {course.totalLessons} módulos · {course.durationMin} min
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
  thumbWrap: {
    height: 130,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    color: '#FFFFFFCC',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1.2,
  },
  lockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    maxWidth: '70%',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(173, 81, 224, 0.85)',
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottom: {
    padding: 14,
    gap: 4,
  },
  kicker: {
    color: Colors.accentPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 20,
  },
  meta: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
});
