import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Colors } from '../../theme';

type Props = {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  message,
  icon = 'folder-open-outline',
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.tile}>
        <Ionicons name={icon} size={28} color={Colors.accentPrimary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
