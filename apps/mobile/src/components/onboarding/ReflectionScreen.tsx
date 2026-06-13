import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui';
import { PenpotFlowShell } from '../penpot';
import type { ReflectionFrame } from '../../data/onboardingFlow';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  frame: ReflectionFrame;
  onNext: () => void;
};

/** Penpot 15/21/27 — pantallas de reflexión narrativa intercaladas en el diagnóstico. */
export function ReflectionScreen({ frame, onNext }: Props) {
  return (
    <PenpotFlowShell
      orbVariant="thinking"
      contentStyle={styles.content}
      footer={<Button title="Continuar" onPress={onNext} />}
    >
      <View style={styles.body}>
        <Text style={styles.script}>{frame.label}</Text>
        <View style={styles.divider} />
        <Text style={styles.bodyText}>{frame.body}</Text>
        {frame.accentHero ? <Text style={styles.accentHero}>{frame.accentHero}</Text> : null}
        {frame.hero ? <Text style={styles.hero}>{frame.hero}</Text> : null}
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
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  script: {
    ...Typography.handwritten,
    color: Colors.accentPrimary,
    fontSize: 30,
    lineHeight: 36,
  },
  divider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.accentPrimary,
    marginBottom: Spacing.xs,
  },
  bodyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 24,
    lineHeight: 32,
  },
  accentHero: {
    ...Typography.hero,
    color: Colors.accentHighlight,
    fontWeight: '700',
    fontSize: 30,
    lineHeight: 38,
  },
  hero: {
    ...Typography.hero,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 30,
    lineHeight: 38,
  },
});
