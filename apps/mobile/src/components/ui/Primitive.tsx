import React from 'react';
import { StyleSheet, Text, View, type DimensionValue, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export function Chip({ label, active }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </View>
  );
}

export function Badge({ label, locked }: { label: string; locked?: boolean }) {
  return (
    <View style={styles.badge}>
      {locked ? <Ionicons name="lock-closed" color={Colors.textTertiary} size={13} /> : null}
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function Avatar({ name, uri, size = 56 }: { name: string; uri?: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function ProgressBar({ value, style }: { value: number; style?: ViewStyle }) {
  const width: DimensionValue = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <View style={[styles.progressTrack, style]}>
      <LinearGradient colors={[Colors.accentPrimary, Colors.accentSecondary]} style={[styles.progressFill, { width }]} />
    </View>
  );
}

export function ProgressRing({ value, size = 92 }: { value: number; size?: number }) {
  const pct = Math.round(Math.max(0, Math.min(100, value)));
  const border = Math.max(3, Math.round(size * 0.098));
  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
        },
      ]}
    >
      <Text style={[styles.ringValue, size < 48 && { fontSize: 9 }]}>{pct}%</Text>
    </View>
  );
}

export function CardGlass({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.cardGlass, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  chipActive: {
    backgroundColor: Colors.accentPrimary,
    borderColor: Colors.accentPrimary,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSurface,
    borderWidth: 2,
    borderColor: Colors.accentPrimary,
  },
  avatarText: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  progressTrack: {
    height: 9,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bgSurface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  ring: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 9,
    borderColor: Colors.accentSecondary,
    backgroundColor: Colors.glass,
  },
  ringValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  cardGlass: {
    padding: Spacing.lg,
    borderRadius: Radius.cardLg,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
});
