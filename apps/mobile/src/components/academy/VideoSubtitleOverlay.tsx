import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';
import type { VttCue } from '../../utils/vttParser';

type Props = {
  cue: VttCue | null;
  /** Distancia desde el borde inferior del area del video. */
  bottomOffset?: number;
};

/**
 * Overlay no interactivo que muestra el texto de la cue activa con un
 * fondo semitransparente para asegurar contraste sobre cualquier video.
 * Si `cue` es null no renderiza nada.
 */
export function VideoSubtitleOverlay({ cue, bottomOffset = 24 }: Props) {
  if (!cue) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{cue.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bubble: {
    maxWidth: '92%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
