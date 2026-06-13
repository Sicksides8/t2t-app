import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../theme';
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
  onPress: () => void;
};

export function HomeSkillChip({ skill, onPress }: Props) {
  const icon = SKILL_ICONS[skill.icon] ?? 'ellipse-outline';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${skill.color}33`, shadowColor: skill.color }]}>
        <Ionicons name={icon} size={22} color={skill.color} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {skill.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    minWidth: 72,
    minHeight: 80,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 4,
  },
  name: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
});
