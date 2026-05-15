import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../theme';

export function DiagnosticIntro() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.script}>Tu perfil hoy</Text>
      <Text style={styles.title}>Así estás entrenando hoy</Text>
      <Text style={styles.subtitle}>
        Algunas habilidades ya son fortalezas. Otras pueden convertirse en tu diferencial.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  script: {
    ...Typography.script,
    fontSize: 24,
    color: Colors.accentPrimary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 29,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textTertiary,
  },
});
