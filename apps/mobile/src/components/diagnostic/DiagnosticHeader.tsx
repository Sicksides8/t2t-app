import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';

type Props = {
  title: string;
  onBack: () => void;
  onShare?: () => void;
};

export function DiagnosticHeader({ title, onBack, onShare }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={12}>
        <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Pressable onPress={onShare} style={styles.iconBtn} hitSlop={12} disabled={!onShare}>
        <Ionicons name="share-outline" size={16} color={onShare ? Colors.textPrimary : Colors.transparent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
    marginBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
});
