import React from 'react';
import { StyleSheet, View } from 'react-native';

/** Orbes de fondo alineados a 60_Mis_Cursos (verdes). */
export function MyCoursesOrbs() {
  return (
    <>
      <View pointerEvents="none" style={styles.orbTop} />
      <View pointerEvents="none" style={styles.orbSide} />
      <View pointerEvents="none" style={styles.orbBottom} />
    </>
  );
}

const styles = StyleSheet.create({
  orbTop: {
    position: 'absolute',
    top: -180,
    right: -90,
    width: 460,
    height: 460,
    borderRadius: 230,
    backgroundColor: '#4CC35B59',
    opacity: 0.4,
  },
  orbSide: {
    position: 'absolute',
    top: 60,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4CC35B73',
    opacity: 0.5,
  },
  orbBottom: {
    position: 'absolute',
    top: 380,
    left: -60,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: '#4CC35B80',
    opacity: 0.55,
  },
});
