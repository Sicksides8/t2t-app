import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../ui';
import { Colors } from '../../theme';

type Props = {
  title?: string;
  progress?: number;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
};

/** Barra superior Penpot: back glass 40px + progreso opcional. */
export function PenpotTopBar({ title, progress, onBack, rightLabel, onRightPress }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable style={styles.back} onPress={onBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        {rightLabel && onRightPress ? (
          <Pressable onPress={onRightPress} hitSlop={8}>
            <Text style={styles.right}>{rightLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>
      {progress != null ? (
        <View style={styles.progress}>
          <ProgressBar value={progress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  flex: {
    flex: 1,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  right: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentHighlight,
    minWidth: 40,
    textAlign: 'right',
  },
  progress: {
    paddingHorizontal: 4,
  },
});
