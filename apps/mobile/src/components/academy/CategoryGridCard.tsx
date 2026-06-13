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
  flash: 'flash',
  bulb: 'bulb-outline',
  people: 'people-outline',
  crown: 'ribbon',
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
      <Ionicons name={icon} size={26} color={skill.color} style={styles.icon} />
      <View style={styles.textCol}>
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
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    minHeight: 80,
  },
  cardFull: {
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
  },
  icon: {
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
  },
});
