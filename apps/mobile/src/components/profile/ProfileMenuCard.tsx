import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Colors, Spacing, Typography } from '../../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ProfileMenuCardProps = {
  label: string;
  icon: IoniconName;
  onPress: () => void;
  highlight?: boolean;
  iconColor?: string;
};

export function ProfileMenuCard({
  label,
  icon,
  onPress,
  highlight = false,
  iconColor,
}: ProfileMenuCardProps) {
  const tint = iconColor ?? (highlight ? Colors.textPrimary : Colors.accentPrimary);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        highlight && styles.cardHighlight,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, highlight && styles.iconWrapHighlight]}>
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        <Text style={[styles.label, highlight && styles.labelHighlight]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: Spacing.sm,
  },
  cardHighlight: {
    backgroundColor: '#B73CEF33',
    borderColor: '#B73CEF66',
  },
  pressed: {
    opacity: 0.88,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapHighlight: {
    backgroundColor: '#FFFFFF22',
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  labelHighlight: {
    fontWeight: '800',
  },
});
