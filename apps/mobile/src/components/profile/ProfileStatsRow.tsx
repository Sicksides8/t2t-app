import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../theme';

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
      <StatCard value={coins} label="T2T Coins" valueColor={Colors.accentHighlight} />
      <StatCard value={modules} label="módulos" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 18,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  value: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '900',
    fontSize: 30,
    lineHeight: 34,
  },
  label: {
    ...Typography.caption,
    color: '#C2AAD6',
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
});
