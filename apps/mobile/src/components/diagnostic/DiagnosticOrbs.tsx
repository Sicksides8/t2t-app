import React from 'react';
import { StyleSheet, View } from 'react-native';

/** Orbes alineados a 30_Resultado / Mi diagnóstico. */
export function DiagnosticOrbs() {
  return (
    <>
      <View pointerEvents="none" style={styles.orbPurple} />
      <View pointerEvents="none" style={styles.orbGreen} />
    </>
  );
}

const styles = StyleSheet.create({
  orbPurple: {
    position: 'absolute',
    top: -200,
    left: -180,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: '#B73CEF59',
    opacity: 0.45,
  },
  orbGreen: {
    position: 'absolute',
    top: 500,
    right: -90,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: '#4CC35B59',
    opacity: 0.4,
  },
});
