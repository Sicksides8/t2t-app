import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PENPOT_FRAMES } from '../../data/penpotFrames';
import { PenpotFlowShell } from '../penpot';
import { PenpotIllustration } from '../penpot/PenpotIllustration';
import { Colors, Spacing, Typography } from '../../theme';

type Props = { onComplete: () => void };

/** Penpot: 01_Splash — auto-advance con dots. */
export function SplashPenpotScreen({ onComplete }: Props) {
  const frame = PENPOT_FRAMES['01_Splash'];

  useEffect(() => {
    const t = setTimeout(onComplete, 2400);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <PenpotFlowShell orbVariant="splash" contentStyle={styles.center}>
      <PenpotIllustration illustrationKey="logo" size={104} label="T2T" />
      <Text style={styles.script}>T2T</Text>
      <Text style={styles.hero}>Academy</Text>
      {frame.body ? <Text style={styles.subtitle}>{frame.body}</Text> : null}
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
        ))}
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  script: {
    ...Typography.script,
    color: Colors.accentHighlight,
    fontSize: 48,
    marginTop: Spacing.lg,
  },
  hero: {
    ...Typography.hero,
    color: Colors.textPrimary,
    fontSize: 36,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: Spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.divider,
  },
  dotActive: {
    backgroundColor: Colors.accentHighlight,
    width: 24,
  },
});
