import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  label?: string;
};

export function AuthDivider({ label = 'o' }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  text: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
});
