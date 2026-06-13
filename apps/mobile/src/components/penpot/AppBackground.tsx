import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { PenpotOrbVariant } from '../../data/penpotFrames';
import { Colors } from '../../theme';
import { PenpotOrbs } from './PenpotOrbs';

// Carga del fondo global. Va en try/catch para que si Metro aún no tiene el
// asset registrado (p.ej. justo después de agregar el archivo, sin reset de
// caché), el módulo no rompa la evaluación y los consumidores sigan
// renderizando aunque sea el color base.
let BG_IMAGE: ImageSourcePropType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  BG_IMAGE = require('../../../assets/fondo.png') as ImageSourcePropType;
} catch (err) {
  BG_IMAGE = null;
  if (__DEV__) {
    console.warn('[AppBackground] No se pudo cargar fondo.png:', err);
  }
}

type Props = {
  variant?: PenpotOrbVariant;
};

/**
 * Fondo único de la app. Si el PNG global no está disponible, cae al color
 * base. Esto evita el "Element type is invalid" cuando Metro no tiene el
 * asset registrado todavía.
 */
export function AppBackground(_props: Props) {
  void _props;
  if (!BG_IMAGE) {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.bg]} />;
  }
  return (
    <ImageBackground
      source={BG_IMAGE}
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, styles.bg]}
    />
  );
}

/**
 * Helper para mantener la API anterior con el orbe-fallback (no se usa por
 * default desde que tenemos `fondo.png`, pero se queda accesible).
 */
export function AppBackgroundOrbs({ variant = 'default' }: Props) {
  return <PenpotOrbs variant={variant} />;
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: Colors.bgPrimary,
  },
});
