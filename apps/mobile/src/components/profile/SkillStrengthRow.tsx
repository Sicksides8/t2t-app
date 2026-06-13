import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  name: string;
  pct: number;
};

function strengthLevel(pct: number): string {
  if (pct >= 80) return 'Expert';
  if (pct >= 70) return 'Fuerza';
  if (pct >= 40) return 'En forma';
  return 'Warm-up';
}

export function SkillStrengthRow({ name, pct }: Props) {
  const clamped = Math.max(0, Math.min(100, pct));
  const level = strengthLevel(clamped);

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.badge}>
          {level} · {clamped}%
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: 'rgba(42, 16, 82, 0.45)',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  badge: {
    color: Colors.accentHighlight,
    fontWeight: '800',
    fontSize: 12,
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF14',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.accentHighlight,
    borderRadius: 999,
  },
});
