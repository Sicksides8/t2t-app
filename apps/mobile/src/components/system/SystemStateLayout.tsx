import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { PenpotFlowShell, PenpotIllustration } from '../penpot';
import { Button } from '../ui';
import { Colors, Spacing, Typography } from '../../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  penpotFrame: string;
  icon: IoniconName;
  title: string;
  body: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  children?: React.ReactNode;
};

/** Layout compartido Penpot 73–76. */
export function SystemStateLayout({
  icon,
  title,
  body,
  primaryLabel,
  onPrimary,
  children,
}: Props) {
  return (
    <PenpotFlowShell contentStyle={styles.center}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={48} color={Colors.accentPrimary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {children}
      {primaryLabel && onPrimary ? <Button title={primaryLabel} onPress={onPrimary} /> : null}
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h1,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
