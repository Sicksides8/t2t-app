import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type Props = {
  label: string;
  color?: string;
  small?: boolean;
};

export function SkillChip({ label, color, small }: Props) {
  return (
    <View style={[styles.chip, small && styles.chipSmall, color ? { borderColor: color } : null]}>
      {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.label, small && styles.labelSmall]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.glass,
  },
  chipSmall: {
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  labelSmall: {
    fontSize: 10,
  },
});
