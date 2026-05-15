import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';

type Props = {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
};

export function MyCoursesTabPill({ label, count, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
        {label} · {count}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  pillActive: {
    backgroundColor: Colors.accentPrimary,
  },
  pillInactive: {
    backgroundColor: Colors.bgSurface,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textActive: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  textInactive: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
