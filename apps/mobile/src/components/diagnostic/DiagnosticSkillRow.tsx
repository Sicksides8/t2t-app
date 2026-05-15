import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { skills } from '../../data/academy';
import { scoreToLevel } from '../../utils/diagnosticBuckets';
import { Colors } from '../../theme';
import type { DiagnosticBucket } from '../../utils/diagnosticBuckets';

const BAR_COLORS: Record<DiagnosticBucket, string> = {
  strength: Colors.accentHighlight,
  developing: Colors.accentPrimary,
  train: Colors.warning,
};

const SCORE_COLORS: Record<DiagnosticBucket, string> = {
  strength: Colors.accentHighlight,
  developing: Colors.accentPrimary,
  train: Colors.warning,
};

type Props = {
  skillId: string;
  score: number;
  bucket: DiagnosticBucket;
};

export function DiagnosticSkillRow({ skillId, score, bucket }: Props) {
  const name = skills.find((s) => s.id === skillId)?.name ?? skillId;
  const { level, max } = scoreToLevel(score);
  const fillColor = BAR_COLORS[bucket];
  const pct = Math.max(0, Math.min(100, score));

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.name}>{name}</Text>
        <Text style={[styles.level, { color: SCORE_COLORS[bucket] }]}>
          {level}/{max}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 4,
    marginBottom: 10,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  level: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.divider,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 4,
  },
});
