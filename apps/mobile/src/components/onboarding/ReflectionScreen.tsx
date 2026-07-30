import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui';
import { PenpotFlowShell } from '../penpot';
import type { ReflectionFrame } from '../../data/onboardingFlow';
import { DIAGNOSTIC_STARTED_BANNER } from '../../constants/onboardingCopy';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  frame: ReflectionFrame;
  onNext: () => void;
  banner?: string;
  primaryLabel?: string;
};

/** Penpot 15/21/27 — pantallas de reflexión narrativa intercaladas en el diagnóstico. */
export function ReflectionScreen({
  frame,
  onNext,
  banner = DIAGNOSTIC_STARTED_BANNER,
  primaryLabel = 'Continuar',
}: Props) {
  const isSpaced = frame.layout === 'spaced';

  return (
    <PenpotFlowShell
      orbVariant="thinking"
      contentStyle={styles.content}
      footer={<Button title={primaryLabel} onPress={onNext} />}
    >
      {banner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}
      <View style={[styles.body, isSpaced && styles.bodySpaced]}>
        <Text style={styles.script}>{frame.label}</Text>
        <View style={styles.divider} />
        <Text style={[styles.bodyText, isSpaced && styles.bodyTextSpaced]}>{frame.body}</Text>
        {frame.accentHero ? (
          <Text style={[styles.accentHero, isSpaced && styles.accentHeroSpaced]}>{frame.accentHero}</Text>
        ) : null}
        {frame.hero ? (
          <Text style={[styles.hero, isSpaced && styles.heroSpaced]}>{frame.hero}</Text>
        ) : null}
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignSelf: 'stretch',
    width: '100%',
  },
  bodySpaced: {
    gap: Spacing.xl,
    paddingTop: Spacing.md,
  },
  script: {
    ...Typography.handwritten,
    color: Colors.accentPrimary,
    fontSize: 36,
    lineHeight: 44,
  },
  banner: {
    alignSelf: 'stretch',
    backgroundColor: '#4CC35B22',
    borderWidth: 1,
    borderColor: '#4CC35B55',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: Spacing.md,
  },
  bannerText: {
    ...Typography.bodyMedium,
    color: Colors.accentHighlight,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '700',
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
    fontSize: 29,
    lineHeight: 38,
    flexShrink: 1,
    alignSelf: 'stretch',
  },
  bodyTextSpaced: {
    marginTop: Spacing.sm,
  },
  accentHero: {
    ...Typography.hero,
    color: Colors.accentHighlight,
    fontWeight: '700',
    fontSize: 36,
    lineHeight: 44,
    flexShrink: 1,
    alignSelf: 'stretch',
  },
  accentHeroSpaced: {
    marginTop: Spacing.md,
  },
  hero: {
    ...Typography.hero,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 36,
    lineHeight: 44,
    flexShrink: 1,
    alignSelf: 'stretch',
  },
  heroSpaced: {
    marginTop: Spacing.lg,
  },
});
