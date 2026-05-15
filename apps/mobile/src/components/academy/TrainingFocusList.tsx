import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { skills } from '../../data/academy';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SKILL_ICONS: Record<string, IoniconName> = {
  sparkles: 'sparkles',
  megaphone: 'megaphone-outline',
  'git-branch': 'git-branch-outline',
  chatbubbles: 'chatbubbles-outline',
  timer: 'timer-outline',
};

function resolveSkill(skillId: string) {
  const skill = skills.find((s) => s.id === skillId);
  const color = skill?.color ?? Colors.accentPrimary;
  return {
    id: skillId,
    name: skill?.name ?? skillId,
    description: skill?.description ?? 'Habilidad prioritaria en tu plan.',
    color,
    icon: SKILL_ICONS[skill?.icon ?? ''] ?? 'ellipse-outline',
  };
}

type Props = {
  skillIds: string[];
};

export function TrainingFocusList({ skillIds }: Props) {
  const items = useMemo(() => skillIds.map((id) => resolveSkill(id)), [skillIds]);

  if (!items.length) return null;

  return (
    <View style={styles.list}>
      {items.map((skill, index) => (
        <View key={skill.id} style={styles.card}>
          <View style={[styles.accentBar, { backgroundColor: skill.color }]} />
          <View style={[styles.iconWrap, { borderColor: skill.color, backgroundColor: `${skill.color}1A` }]}>
            <Ionicons name={skill.icon} size={22} color={skill.color} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.name}>{skill.name}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {skill.description}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { borderColor: skill.color }]}>
            <Text style={[styles.priorityText, { color: skill.color }]}>{index + 1}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingLeft: Spacing.md,
    borderRadius: Radius.cardLg,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: Radius.cardLg,
    borderBottomLeftRadius: Radius.cardLg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  textCol: {
    flex: 1,
    gap: Spacing.xs,
    paddingRight: Spacing.xs,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
  },
  priorityText: {
    ...Typography.caption,
    fontWeight: '800',
    fontSize: 12,
  },
});
