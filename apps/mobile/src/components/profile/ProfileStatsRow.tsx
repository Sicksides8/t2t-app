import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type ProfileStatsRowProps = {
  streakDays: number;
  coins: number;
  modules: number;
};

function StatCard({
  value,
  label,
  valueColor,
}: {
  value: number;
  label: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function ProfileStatsRow({ streakDays, coins, modules }: ProfileStatsRowProps) {
  return (
    <View style={styles.row}>
      <StatCard value={streakDays} label="días" />
      <StatCard value={coins} label="T2T Coins" valueColor={Colors.accentSecondary} />
      <StatCard value={modules} label="módulos" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  value: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
