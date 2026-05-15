import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { PenpotFrameMeta } from '../../data/penpotFrames';
import { Button } from '../ui';
import { Colors, Spacing, Typography } from '../../theme';
import { PenpotFlowShell } from './PenpotFlowShell';
import { PenpotIllustration } from './PenpotIllustration';
import { PenpotTopBar } from './PenpotTopBar';

type Props = {
  frame: PenpotFrameMeta;
  progress?: number;
  onSkip?: () => void;
};

/** Penpot: frames 21, 24–29 (transiciones thinking). */
export function PenpotThinkingScreen({ frame, progress, onSkip }: Props) {
  return (
    <PenpotFlowShell orbVariant="thinking" contentStyle={styles.content}>
      {progress != null ? <PenpotTopBar progress={progress} /> : null}
      <View style={styles.center}>
        <PenpotIllustration illustrationKey="thinking" size={140} />
        <ActivityIndicator size="large" color={Colors.accentPrimary} style={styles.spinner} />
        <Text style={styles.title}>{frame.title}</Text>
        {frame.body ? <Text style={styles.body}>{frame.body}</Text> : null}
      </View>
      {onSkip ? (
        <View style={styles.footer}>
          <Button title="Saltar al resultado" variant="ghost" onPress={onSkip} />
        </View>
      ) : null}
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: 12,
  },
  spinner: {
    marginTop: 8,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: Spacing.lg,
  },
});
