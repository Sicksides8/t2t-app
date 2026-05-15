import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PENPOT_FRAMES, type PenpotFrameMeta } from '../../data/penpotFrames';
import { Button } from '../ui';
import { PenpotFlowShell, PenpotIllustration, PenpotTopBar } from '../penpot';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  frame?: PenpotFrameMeta;
  progress?: number;
  primaryLabel: string;
  onNext: () => void;
  children?: React.ReactNode;
};

/** Penpot: 31_Cierre — compartido onboarding + hooks. */
export function PenpotClosureScreen({
  frame = PENPOT_FRAMES['31_Cierre'],
  progress = 100,
  primaryLabel,
  onNext,
  children,
}: Props) {
  return (
    <PenpotFlowShell
      orbVariant="default"
      contentStyle={styles.content}
      footer={<Button title={primaryLabel} onPress={onNext} />}
    >
      <PenpotTopBar progress={progress} />
      <View style={styles.body}>
        <PenpotIllustration illustrationKey="closure" size={140} />
        <Text style={styles.title}>{frame.title}</Text>
        {frame.body ? <Text style={styles.bodyText}>{frame.body}</Text> : null}
        {children}
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  bodyText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
