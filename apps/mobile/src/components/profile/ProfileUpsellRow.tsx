import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

export function ProfileUpsellRow() {
  return (
    <Pressable style={styles.row}>
      <Ionicons name="sparkles" size={18} color={Colors.accentHighlight} />
      <Text style={styles.text}>Pasate a anual y ahorrá 20%</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.accentHighlight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#4CC35B4D',
    borderWidth: 1,
    borderColor: '#4CC35B66',
    marginBottom: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentHighlight,
  },
});
