import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, icon = 'folder-open-outline', actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={Colors.textTertiary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <Button title={actionLabel} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
