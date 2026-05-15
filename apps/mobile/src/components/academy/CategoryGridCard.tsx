import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';
import type { Skill } from '../../types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SKILL_ICONS: Record<string, IoniconName> = {
  sparkles: 'sparkles',
  megaphone: 'megaphone-outline',
  'git-branch': 'git-branch-outline',
  chatbubbles: 'chatbubbles-outline',
  timer: 'timer-outline',
};

type Props = {
  skill: Skill;
  courseCount: number;
  onPress: () => void;
  fullWidth?: boolean;
};

export function CategoryGridCard({ skill, courseCount, onPress, fullWidth }: Props) {
  const icon = SKILL_ICONS[skill.icon] ?? 'ellipse-outline';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, fullWidth && styles.cardFull, pressed && styles.pressed]}
    >
      <View style={[styles.iconGlow, { shadowColor: skill.color }]}>
        <Ionicons name={icon} size={22} color={skill.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {skill.name}
        </Text>
        <Text style={styles.meta}>
          {courseCount} {courseCount === 1 ? 'curso' : 'cursos'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cardFull: {
    flex: 1,
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
  },
  iconGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 4,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },
});
