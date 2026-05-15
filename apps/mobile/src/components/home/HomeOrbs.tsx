import React from 'react';
import { StyleSheet, View } from 'react-native';

/** Orbes de fondo alineados a 52_Home (morado arriba-izq, verde arriba-der, verde medio-izq). */
export function HomeOrbs() {
  return (
    <>
      <View pointerEvents="none" style={styles.orbPurple} />
      <View pointerEvents="none" style={styles.orbGreenTop} />
      <View pointerEvents="none" style={styles.orbGreenMid} />
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
    backgroundColor: '#B73CEF40',
    opacity: 0.4,
  },
  orbGreenTop: {
    position: 'absolute',
    top: 60,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4CC35B73',
    opacity: 0.5,
  },
  orbGreenMid: {
    position: 'absolute',
    top: 280,
    left: -50,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: '#4CC35B80',
    opacity: 0.55,
  },
});
