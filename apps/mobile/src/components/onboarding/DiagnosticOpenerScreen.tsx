import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui';
import { PenpotFlowShell } from '../penpot';
import { OPENER_FRAME } from '../../data/onboardingFlow';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  onNext: () => void;
};

/** Penpot 10_InicioDiagnostico — apertura del diagnóstico, handwritten verde + pregunta. */
export function DiagnosticOpenerScreen({ onNext }: Props) {
  return (
    <PenpotFlowShell
      orbVariant="diagnostic"
      contentStyle={styles.content}
      footer={<Button title={OPENER_FRAME.primaryLabel} onPress={onNext} />}
    >
      <View style={styles.body}>
        <Text style={styles.script}>{OPENER_FRAME.script}</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>{OPENER_FRAME.subtitle}</Text>
        <Text style={styles.hero}>{OPENER_FRAME.hero}</Text>
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  script: {
    ...Typography.handwritten,
    color: Colors.accentHighlight,
    fontSize: 36,
    lineHeight: 42,
  },
  divider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.accentPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 18,
  },
  hero: {
    ...Typography.hero,
    color: Colors.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    marginTop: Spacing.xs,
  },
});
