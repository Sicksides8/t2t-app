import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  label: string;
  dotColor: string;
};

export function DiagnosticSectionHeader({ label, dotColor }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.textTertiary,
  },
});
