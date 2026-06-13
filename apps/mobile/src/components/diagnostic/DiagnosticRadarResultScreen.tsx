import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardGlass, Button } from '../ui';
import { PenpotFlowShell } from '../penpot';
import {
  DIAGNOSTIC_SKILLS,
  SKILL_LABELS,
  SKILL_LABELS_SHORT,
  type DiagnosticSkillId,
} from '../../data/diagnostic';
import { bucketSkill } from '../../utils/diagnosticBuckets';
import type { DiagnosticResult } from '../../types';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { DiagnosticRadarChart, type RadarAxis, type RadarLevel } from './DiagnosticRadarChart';

type Props = {
  diagnostic: DiagnosticResult;
  onBack?: () => void;
  onShare?: () => void;
  onPrimary: () => void;
  onSecondary: () => void;
  /** Abre la vista 34_Mapa_Cerebral (vista secundaria del radar). */
  onBrainMap?: () => void;
};

function bucketToLevel(score: number): RadarLevel {
  const bucket = bucketSkill(score);
  if (bucket === 'strength') return 'strong';
  if (bucket === 'train') return 'toTrain';
  return 'developing';
}

/** Penpot 32_Resultado_Radar — pantalla final con radar de 12 ejes + insight + 2 CTAs. */
export function DiagnosticRadarResultScreen({
  diagnostic,
  onBack,
  onShare,
  onPrimary,
  onSecondary,
  onBrainMap,
}: Props) {
  const axes: RadarAxis[] = useMemo(
    () =>
      DIAGNOSTIC_SKILLS.map((skillId) => {
        const value = diagnostic.scores[skillId] ?? 0;
        return {
          key: skillId,
          label: SKILL_LABELS_SHORT[skillId as DiagnosticSkillId],
          value,
          level: bucketToLevel(value),
        };
      }),
    [diagnostic.scores],
  );

  const topSkill = diagnostic.topSkills[0] as DiagnosticSkillId | undefined;
  const weakSkill = diagnostic.weakSkills[0] as DiagnosticSkillId | undefined;
  const topName = topSkill ? SKILL_LABELS[topSkill] : 'Liderazgo';
  const weakName = weakSkill ? SKILL_LABELS[weakSkill] : 'Comunicación';

  return (
    <PenpotFlowShell
      orbVariant="diagnostic"
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button title="Ver mi plan de entrenamiento" onPress={onPrimary} />
          <Button title="Recibir resultado por email" variant="ghost" onPress={onSecondary} />
        </View>
      }
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          style={styles.iconBtn}
          hitSlop={8}
          disabled={!onBack}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={onShare}
          style={styles.iconBtn}
          hitSlop={8}
          disabled={!onShare}
        >
          <Ionicons name="share-outline" size={18} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Tu perfil hoy</Text>
          <Text style={styles.script}>Mirá tus músculos</Text>
          <Text style={styles.subtitle}>12 habilidades · una mirada honesta</Text>
        </View>

        <View style={styles.chartWrap}>
          <DiagnosticRadarChart axes={axes} size={300} maxRadius={108} />
        </View>

        {onBrainMap ? (
          <Pressable onPress={onBrainMap} style={styles.brainMapBtn} hitSlop={6}>
            <Ionicons name="git-network-outline" size={16} color={Colors.accentPrimary} />
            <Text style={styles.brainMapText}>Ver mapa cerebral</Text>
          </Pressable>
        ) : null}

        <View style={styles.legend}>
          <LegendItem color={Colors.accentHighlight} label="Fortaleza" />
          <LegendItem color={Colors.accentPrimary} label="En desarrollo" />
          <LegendItem color={Colors.warning} label="A entrenar" />
        </View>

        <CardGlass style={styles.insight}>
          <Ionicons name="sparkles" size={18} color={Colors.accentHighlight} />
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>Tu fuerte: {topName}</Text>
            <Text style={styles.insightBody}>
              Empezamos por entrenar {weakName}, tu mayor oportunidad.
            </Text>
          </View>
        </CardGlass>
      </ScrollView>
    </PenpotFlowShell>
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
  content: {
    flex: 1,
    paddingTop: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  scroll: {
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 26,
  },
  script: {
    ...Typography.handwritten,
    color: Colors.accentHighlight,
    fontSize: 24,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
  },
  chartWrap: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF0F',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: Spacing.lg,
  },
  insightText: {
    flex: 1,
    gap: 2,
  },
  insightTitle: {
    ...Typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  insightBody: {
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  footer: {
    gap: Spacing.xs,
  },
  brainMapBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#B73CEF22',
    borderWidth: 1,
    borderColor: '#B73CEF55',
  },
  brainMapText: {
    ...Typography.caption,
    color: Colors.accentPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
});
