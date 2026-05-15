import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PenpotFrameMeta } from '../../data/penpotFrames';
import { PenpotFlowShell, PenpotIllustration } from '../penpot';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  frame: PenpotFrameMeta;
  children: React.ReactNode;
  onBack?: () => void;
};

/** Shell auth Penpot 32–35. */
export function AuthPenpotShell({ frame, children }: Props) {
  return (
    <PenpotFlowShell orbVariant="auth" scroll contentStyle={styles.wrap}>
      <PenpotIllustration illustrationKey={frame.illustrationKey ?? 'auth'} size={88} />
      <Text style={styles.title}>{frame.title}</Text>
      {frame.body ? <Text style={styles.subtitle}>{frame.body}</Text> : null}
      <View style={styles.form}>{children}</View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  form: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
});
