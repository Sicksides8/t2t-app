import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';

export function AuthDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text}>o</Text>
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
