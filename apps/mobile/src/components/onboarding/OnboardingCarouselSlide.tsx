import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui';
import { PenpotFlowShell } from '../penpot';
import type { CarouselSlide } from '../../data/onboardingFlow';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  slide: CarouselSlide;
  dotIndex: number;
  totalDots: number;
  onNext: () => void;
};

/** Penpot 04_Impacto..08_Transformacion — story slides del carrusel intro. */
export function OnboardingCarouselSlide({ slide, dotIndex, totalDots, onNext }: Props) {
  return (
    <PenpotFlowShell
      orbVariant="default"
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button title="Continuar" onPress={onNext} />
          <Text style={styles.footerCaption}>Toca para continuar</Text>
        </View>
      }
    >
      <View style={styles.dots}>
        {Array.from({ length: totalDots }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === dotIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.body}>
        {slide.sections.map((section, i) => {
          if (section.kind === 'pre') {
            return (
              <Text key={i} style={styles.pre}>
                {section.text}
              </Text>
            );
          }
          if (section.kind === 'hero') {
            return (
              <Text key={i} style={styles.hero}>
                {section.text}
              </Text>
            );
          }
          if (section.kind === 'subtitle') {
            return (
              <View key={i} style={styles.subtitleWrap}>
                <Text style={styles.subtitle}>{section.text}</Text>
                {section.divider !== false ? <View style={styles.divider} /> : null}
              </View>
            );
          }
          if (section.kind === 'accent') {
            return (
              <Text key={i} style={styles.accent}>
                {section.text}
              </Text>
            );
          }
          return (
            <Text key={i} style={styles.body2}>
              {section.text}
            </Text>
          );
        })}
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.xxxl,
  },
  dot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF26',
  },
  dotActive: {
    backgroundColor: Colors.textPrimary,
    width: 28,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingBottom: Spacing.xxl,
  },
  pre: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 22,
    lineHeight: 30,
  },
  hero: {
    ...Typography.hero,
    color: Colors.textPrimary,
    fontSize: 32,
    lineHeight: 38,
  },
  subtitleWrap: {
    gap: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 22,
    lineHeight: 28,
  },
  divider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textTertiary,
  },
  accent: {
    ...Typography.h1,
    color: Colors.accentHighlight,
    fontSize: 36,
    lineHeight: 42,
  },
  body2: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  footerCaption: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
  },
});
