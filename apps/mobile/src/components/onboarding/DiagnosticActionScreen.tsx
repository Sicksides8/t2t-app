import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { PenpotFlowShell } from '../penpot';
import { ACTION_FRAME } from '../../data/onboardingFlow';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  /** Total de dots del carrusel intro (incluye 09 como último). */
  totalDots: number;
  onNext: () => void;
  onSkip: () => void;
};

/** Penpot 09_Accion — pantalla de acción pre-diagnóstico (último slot del carrusel). */
export function DiagnosticActionScreen({ totalDots, onNext, onSkip }: Props) {
  const dotIndex = totalDots - 1;

  return (
    <PenpotFlowShell
      orbVariant="default"
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button title={ACTION_FRAME.primaryLabel} onPress={onNext} />
          <Button title={ACTION_FRAME.ghostLabel} variant="ghost" onPress={onSkip} />
        </View>
      }
    >
      <View style={styles.dots}>
        {Array.from({ length: totalDots }).map((_, i) => (
          <View key={i} style={[styles.dot, i === dotIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.body}>
        <Text style={styles.hero}>{ACTION_FRAME.hero}</Text>
        <View style={styles.chips}>
          {ACTION_FRAME.chips.map((chip) => (
            <View key={chip.label} style={styles.chip}>
              <Ionicons name={chip.icon} size={16} color={Colors.accentHighlight} />
              <Text style={styles.chipValue}>{chip.value}</Text>
              <Text style={styles.chipLabel}>{chip.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.body2}>{ACTION_FRAME.body}</Text>
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.xxxl,
  },
  dot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF26',
  },
  dotActive: {
    backgroundColor: Colors.textPrimary,
    width: 28,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  hero: {
    ...Typography.hero,
    color: Colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipValue: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  chipLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '400',
    fontSize: 13,
  },
  body2: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    gap: Spacing.xs,
    alignItems: 'stretch',
  },
});
