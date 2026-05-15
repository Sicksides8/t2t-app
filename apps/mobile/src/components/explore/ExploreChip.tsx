import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Typography } from '../../theme';

type Props = {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

export function ExploreChip({ label, active, onPress, icon }: Props) {
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
        {icon ? (
          <Ionicons name={icon} size={12} color={active ? Colors.textPrimary : Colors.textSecondary} />
        ) : null}
        <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
  },
  chipActive: {
    backgroundColor: Colors.accentPrimary,
  },
  chipInactive: {
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  text: {
    fontSize: 12,
  },
  textActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  textInactive: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
