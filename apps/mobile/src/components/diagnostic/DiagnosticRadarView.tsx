import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { computeDiagnosticScores, DIAGNOSTIC_SKILLS } from '../../data/diagnostic';
import { skills } from '../../data/academy';
import type { DiagnosticResult } from '../../types';
import { Colors, Spacing } from '../../theme';
import { CardGlass } from '../ui';
import { DiagnosticRadarChart } from './DiagnosticRadarChart';

type Props = {
  diagnostic: DiagnosticResult;
};

export function DiagnosticRadarView({ diagnostic }: Props) {
  const { scores, topSkills, weakSkills } = useMemo(
    () => computeDiagnosticScores(diagnostic.answers),
    [diagnostic.answers],
  );

  const topName = skills.find((s) => s.id === topSkills[0])?.name ?? 'Comunicación';
  const weakName = skills.find((s) => s.id === weakSkills[0])?.name ?? 'Productividad';

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={styles.script}>Mirá tus músculos</Text>
        <Text style={styles.title}>Así estás entrenando hoy</Text>
        <Text style={styles.subtitle}>{DIAGNOSTIC_SKILLS.length} dimensiones · una mirada honesta</Text>
      </View>

      <DiagnosticRadarChart scores={scores} />

      <View style={styles.legend}>
        <LegendItem color={Colors.accentHighlight} label="Fortaleza" />
        <LegendItem color={Colors.accentPrimary} label="En desarrollo" />
        <LegendItem color={Colors.warning} label="A entrenar" />
      </View>

      <CardGlass style={styles.insight}>
        <Ionicons name="sparkles" size={18} color={Colors.accentPrimary} />
        <View style={styles.insightText}>
          <Text style={styles.insightTitle}>Tu fuerte: {topName}</Text>
          <Text style={styles.insightBody}>
            Empezamos por entrenar {weakName}, tu mayor oportunidad.
          </Text>
        </View>
      </CardGlass>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingBottom: Spacing.md,
  },
  intro: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  script: {
    fontFamily: 'Caveat',
    fontSize: 22,
    fontWeight: '600',
    color: Colors.accentPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  insightText: {
    flex: 1,
    gap: 2,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  insightBody: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textTertiary,
  },
});
