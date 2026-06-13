import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

type Props = {
  onPress?: () => void;
};

export function ProfileUpsellRow({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Ionicons name="sparkles" size={18} color={Colors.accentHighlight} />
      <Text style={styles.text}>Pasate a anual y ahorrá 20%</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.accentPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#4CC35B26',
    borderWidth: 1,
    borderColor: '#4CC35B66',
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accentHighlight,
  },
});
