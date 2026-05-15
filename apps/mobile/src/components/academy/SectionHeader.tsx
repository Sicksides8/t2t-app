import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../theme';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Sin margen superior (p. ej. primera sección tras el hero con gap 18). */
  isFirst?: boolean;
};

export function SectionHeader({ title, actionLabel, onAction, isFirst }: Props) {
  return (
    <View style={[styles.row, isFirst ? styles.rowFirst : null]}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  rowFirst: {
    marginTop: 0,
  },
  title: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  action: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentPrimary,
  },
});
