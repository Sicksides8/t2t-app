import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PenpotFrameMeta } from '../../data/penpotFrames';
import { Button } from '../ui';
import { PenpotFlowShell, PenpotIllustration, PenpotTopBar } from '../penpot';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  frame: PenpotFrameMeta;
  progress: number;
  primaryLabel: string;
  onNext: () => void;
  onBack?: () => void;
};

/** Penpot: 02_Welcome, 03–08 story slides. */
export function OnboardingStorySlide({ frame, progress, primaryLabel, onNext, onBack }: Props) {
  return (
    <PenpotFlowShell
      orbVariant="default"
      contentStyle={styles.content}
      footer={<Button title={primaryLabel} onPress={onNext} />}
    >
      <PenpotTopBar progress={progress} onBack={onBack} />
      <View style={styles.body}>
        <PenpotIllustration illustrationKey={frame.illustrationKey ?? 'story'} size={140} />
        <Text style={styles.title}>{frame.title}</Text>
        {frame.body ? <Text style={styles.bodyText}>{frame.body}</Text> : null}
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
    lineHeight: 20,
  },
});
