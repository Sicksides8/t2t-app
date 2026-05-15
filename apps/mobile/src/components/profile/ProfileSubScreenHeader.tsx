import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

type Props = {
  title: string;
  onBack: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
};

export function ProfileSubScreenHeader({ title, onBack, rightLabel, onRightPress }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={12} accessibilityRole="button">
        <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {rightLabel && onRightPress ? (
        <Pressable onPress={onRightPress} hitSlop={8}>
          <Text style={styles.right}>{rightLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  right: {
    width: 40,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accentPrimary,
    textAlign: 'right',
  },
});
