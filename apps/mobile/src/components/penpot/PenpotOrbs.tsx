import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { PenpotOrbVariant } from '../../data/penpotFrames';

type Props = { variant?: PenpotOrbVariant };

/** Orbes de fondo parametrizables por flujo Penpot. */
export function PenpotOrbs({ variant = 'default' }: Props) {
  if (variant === 'splash') {
    return (
      <>
        <View pointerEvents="none" style={[styles.orb, styles.splashPurple]} />
        <View pointerEvents="none" style={[styles.orb, styles.splashGreen]} />
      </>
    );
  }
  if (variant === 'auth') {
    return (
      <>
        <View pointerEvents="none" style={[styles.orb, styles.authPurple]} />
        <View pointerEvents="none" style={[styles.orb, styles.authGreen]} />
      </>
    );
  }
  if (variant === 'diagnostic' || variant === 'thinking') {
    return (
      <>
        <View pointerEvents="none" style={[styles.orb, styles.diagPurple]} />
        <View pointerEvents="none" style={[styles.orb, styles.diagGreen]} />
      </>
    );
  }
  return (
    <>
      <View pointerEvents="none" style={[styles.orb, styles.defaultPurple]} />
      <View pointerEvents="none" style={[styles.orb, styles.defaultGreenTop]} />
      <View pointerEvents="none" style={[styles.orb, styles.defaultGreenMid]} />
    </>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute' },
  splashPurple: {
    top: -220,
    left: -200,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: '#B73CEF50',
    opacity: 0.5,
  },
  splashGreen: {
    top: 120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#4CC35B66',
    opacity: 0.45,
  },
  authPurple: {
    top: -180,
    left: -160,
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: '#B73CEF45',
    opacity: 0.4,
  },
  authGreen: {
    bottom: 80,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#4CC35B55',
    opacity: 0.35,
  },
  diagPurple: {
    top: -200,
    left: -180,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: '#B73CEF59',
    opacity: 0.45,
  },
  diagGreen: {
    top: 500,
    right: -90,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: '#4CC35B59',
    opacity: 0.4,
  },
  defaultPurple: {
    top: -200,
    left: -180,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: '#B73CEF40',
    opacity: 0.4,
  },
  defaultGreenTop: {
    top: 60,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4CC35B73',
    opacity: 0.5,
  },
  defaultGreenMid: {
    top: 280,
    left: -50,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: '#4CC35B80',
    opacity: 0.55,
  },
});
