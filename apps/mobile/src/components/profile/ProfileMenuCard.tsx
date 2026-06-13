import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Colors, Typography } from '../../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ProfileMenuCardProps = {
  label: string;
  icon: IoniconName;
  onPress: () => void;
  highlight?: boolean;
  iconColor?: string;
  iconNode?: React.ReactNode;
};

export function ProfileMenuCard({
  label,
  icon,
  onPress,
  highlight = false,
  iconColor,
  iconNode,
}: ProfileMenuCardProps) {
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
        <View style={styles.iconSlot}>
          {iconNode ? (
            iconNode
          ) : (
            <Ionicons
              name={icon}
              size={22}
              color={highlight ? '#FFFFFF' : iconColor ?? Colors.accentHighlight}
            />
          )}
        </View>
        <Text style={[styles.label, highlight && styles.labelHighlight]}>{label}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={highlight ? '#FFFFFFCC' : Colors.accentPrimary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(42, 16, 82, 0.45)',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    marginBottom: 10,
  },
  cardHighlight: {
    backgroundColor: Colors.accentPrimary,
    borderColor: Colors.accentPrimary,
  },
  pressed: {
    opacity: 0.88,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  labelHighlight: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
