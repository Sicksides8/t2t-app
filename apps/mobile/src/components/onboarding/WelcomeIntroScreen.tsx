import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui';
import { PenpotFlowShell } from '../penpot';
import { BrainCharacter } from '../../assets/brand';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  onNext: () => void;
  onSkipToLogin: () => void;
};

/**
 * Penpot 02_Welcome (rediseñado): primera pantalla del carrusel intro.
 * - Hero: ilustración cerebro+pesas (cerebro-t2t.png).
 * - Título "Tu gimnasio mental" + bajada.
 * - Dots 1/3.
 * - CTAs "Empezar" / "Ya tengo cuenta".
 */
export function WelcomeIntroScreen({ onNext, onSkipToLogin }: Props) {
  return (
    <PenpotFlowShell
      orbVariant="default"
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button title="Empezar" onPress={onNext} />
          <Button title="Ya tengo cuenta" variant="ghost" onPress={onSkipToLogin} />
        </View>
      }
    >
      <View style={styles.heroWrap}>
        <Image
          source={BrainCharacter}
          style={styles.brainImage}
          resizeMode="contain"
          accessibilityLabel="Cerebro con pesas T2T"
        />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>Tu gimnasio mental</Text>
        <Text style={styles.body}>
          Las habilidades blandas son músculos.{'\n'}
          Te ayudamos a entrenarlas en sesiones cortas, cada día.
        </Text>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  heroWrap: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainImage: {
    width: '100%',
    height: 320,
    maxWidth: 360,
  },
  copy: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 30,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.divider,
  },
  dotActive: {
    backgroundColor: Colors.accentPrimary,
    width: 24,
  },
  footer: {
    gap: Spacing.sm,
  },
});
