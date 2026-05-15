import React from 'react';
import { StyleSheet, View } from 'react-native';

/** Orbes de fondo alineados a 61_Perfil (morado + verde). */
export function ProfileOrbs() {
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
    top: -100,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#B73CEF59',
    opacity: 0.45,
  },
  orbGreen: {
    position: 'absolute',
    top: 280,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#4CC35B40',
    opacity: 0.35,
  },
});
