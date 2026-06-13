import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Button, CardGlass } from '../ui';
import { PenpotFlowShell } from '../penpot';
import {
  SKILL_LABELS_SHORT,
  type DiagnosticSkillId,
} from '../../data/diagnostic';
import { bucketSkill, type DiagnosticBucket } from '../../utils/diagnosticBuckets';
import type { DiagnosticResult } from '../../types';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type Props = {
  diagnostic: DiagnosticResult;
  onBack: () => void;
  onShare?: () => void;
  onPrimary: () => void;
  onSecondary: () => void;
};

type ZoneId = 'frontal' | 'prefrontal' | 'temporal' | 'parietal' | 'limbico' | 'cerebelo';

type Zone = {
  id: ZoneId;
  label: string;
  skills: [DiagnosticSkillId, DiagnosticSkillId];
  /** Coordenadas relativas dentro del cerebro (0..1). */
  dot: { x: number; y: number };
};

const BRAIN_ZONES: Zone[] = [
  { id: 'frontal',    label: 'Frontal',    skills: ['liderazgo', 'influencia'],            dot: { x: 0.38, y: 0.18 } },
  { id: 'prefrontal', label: 'Prefrontal', skills: ['productividad', 'aprendizaje'],       dot: { x: 0.40, y: 0.22 } },
  { id: 'temporal',   label: 'Temporal',   skills: ['comunicacion', 'escucha'],            dot: { x: 0.28, y: 0.55 } },
  { id: 'parietal',   label: 'Parietal',   skills: ['creatividad', 'resolucion'],          dot: { x: 0.55, y: 0.32 } },
  { id: 'limbico',    label: 'Límbico',    skills: ['gestionEmocional', 'liderazgoHumano'], dot: { x: 0.50, y: 0.50 } },
  { id: 'cerebelo',   label: 'Cerebelo',   skills: ['adaptabilidad', 'equipo'],            dot: { x: 0.70, y: 0.65 } },
];

const ZONE_SUBTITLE: Record<ZoneId, string> = {
  frontal: 'Liderazgo · Influencia',
  prefrontal: 'Productividad · Aprendizaje',
  temporal: 'Comunicación · Escucha',
  parietal: 'Creatividad · Resolución',
  limbico: 'Gest. Emoc. · Lid. Humano',
  cerebelo: 'Adaptabilidad · Equipo',
};

function bucketColor(bucket: DiagnosticBucket): string {
  if (bucket === 'strength') return Colors.accentHighlight;
  if (bucket === 'train') return Colors.error;
  return Colors.warning;
}

function scoreToFive(scoreZeroHundred: number): string {
  return ((scoreZeroHundred / 100) * 5).toFixed(1);
}

/** Penpot 34_Mapa_Cerebral — 6 zonas, una mirada honesta. */
export function DiagnosticBrainMapScreen({
  diagnostic,
  onBack,
  onShare,
  onPrimary,
  onSecondary,
}: Props) {
  const zones = useMemo(
    () =>
      BRAIN_ZONES.map((zone) => {
        const [a, b] = zone.skills;
        const sa = diagnostic.scores[a] ?? 0;
        const sb = diagnostic.scores[b] ?? 0;
        const avg = (sa + sb) / 2;
        const bucket = bucketSkill(avg);
        return { ...zone, avg, bucket };
      }),
    [diagnostic.scores],
  );

  const { topZone, weakZone } = useMemo(() => {
    const sorted = [...zones].sort((a, b) => b.avg - a.avg);
    return {
      topZone: sorted[0]?.label ?? 'Temporal',
      weakZone: sorted[sorted.length - 1]?.label ?? 'Límbica',
    };
  }, [zones]);

  return (
    <PenpotFlowShell
      orbVariant="diagnostic"
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button title="Ver mi plan de entrenamiento" onPress={onPrimary} />
          <Button title="Volver al radar" variant="ghost" onPress={onSecondary} />
        </View>
      }
    >
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Mapa cerebral</Text>
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
          <Text style={styles.script}>Conoce tu cerebro</Text>
          <Text style={styles.title}>6 zonas, una mirada honesta</Text>
          <Text style={styles.subtitle}>Cada zona agrupa 2 habilidades de tu diagnóstico</Text>
        </View>

        <View style={styles.grid}>
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              label={zone.label}
              subtitle={ZONE_SUBTITLE[zone.id]}
              dot={zone.dot}
              avg={zone.avg}
              bucket={zone.bucket}
            />
          ))}
        </View>

        <View style={styles.legend}>
          <LegendItem color={Colors.accentHighlight} label="Fortaleza" />
          <LegendItem color={Colors.warning} label="En desarrollo" />
          <LegendItem color={Colors.error} label="A entrenar" />
        </View>

        <CardGlass style={styles.insight}>
          <Ionicons name="sparkles" size={18} color={Colors.accentPrimary} />
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>Tu zona {topZone} es tu fuerte</Text>
            <Text style={styles.insightBody}>
              Empezamos por entrenar la zona {weakZone}, tu mayor oportunidad de crecimiento.
            </Text>
          </View>
        </CardGlass>
      </ScrollView>
    </PenpotFlowShell>
  );
}

function ZoneCard({
  label,
  subtitle,
  dot,
  avg,
  bucket,
}: {
  label: string;
  subtitle: string;
  dot: { x: number; y: number };
  avg: number;
  bucket: DiagnosticBucket;
}) {
  const color = bucketColor(bucket);
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: `${color}99`,
          shadowColor: color,
        },
      ]}
    >
      <View style={styles.brainWrap}>
        <BrainSilhouette />
        <View
          style={[
            styles.dot,
            {
              backgroundColor: color,
              left: `${dot.x * 100}%`,
              top: `${dot.y * 100}%`,
              shadowColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
      <View style={[styles.pill, { backgroundColor: `${color}24`, borderColor: `${color}80` }]}>
        <Text style={[styles.pillText, { color }]}>{scoreToFive(avg)}/5</Text>
      </View>
    </View>
  );
}

function BrainSilhouette() {
  // Silueta simplificada del cerebro (placeholder gris suave hasta tener PNG).
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 90">
      <Path
        d="M22 32 C 14 32, 10 42, 16 50 C 12 58, 18 68, 28 68 L 50 70 L 50 22 C 40 18, 28 22, 22 32 Z"
        fill="#3A1B6E"
        stroke="#FFFFFF22"
        strokeWidth="1.2"
      />
      <Path
        d="M78 32 C 86 32, 90 42, 84 50 C 88 58, 82 68, 72 68 L 50 70 L 50 22 C 60 18, 72 22, 78 32 Z"
        fill="#2A1052"
        stroke="#FFFFFF22"
        strokeWidth="1.2"
      />
      <Path
        d="M30 38 Q 36 32, 42 38 M 30 50 Q 36 44, 42 50 M 58 38 Q 64 32, 70 38 M 58 50 Q 64 44, 70 50"
        stroke="#FFFFFF1F"
        strokeWidth="1"
        fill="none"
      />
    </Svg>
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

const CARD_GAP = 10;

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
  topTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: 16,
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
    marginBottom: Spacing.lg,
  },
  script: {
    ...Typography.script,
    color: Colors.accentPrimary,
    fontSize: 22,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    justifyContent: 'space-between',
  },
  card: {
    width: `${(100 - 4) / 3}%`,
    minHeight: 168,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#1F0A40CC',
    alignItems: 'center',
    gap: 4,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  brainWrap: {
    width: 72,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    marginTop: -5,
    shadowOpacity: 0.7,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  cardLabel: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: 13,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  pill: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginTop: Spacing.sm,
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
});
