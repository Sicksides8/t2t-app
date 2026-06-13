import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { T2TLogo } from '../../assets/brand';
import { PenpotFlowShell } from '../penpot';
import { Colors, Spacing, Typography } from '../../theme';

type Props = { onComplete: () => void };

const APP_VERSION = 'v1.0.0';

/** Penpot: 01_Splash — "Tu gimnasio mental" + logo + dots + versión. */
export function SplashPenpotScreen({ onComplete }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2400);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <PenpotFlowShell orbVariant="splash" contentStyle={styles.content}>
      <View style={styles.center}>
        <Text style={styles.script}>Tu gimnasio{'\n'}mental</Text>
        <View style={styles.logoWrap}>
          <Image source={T2TLogo} style={styles.logo} resizeMode="cover" />
        </View>
        <Text style={styles.brand}>T2T Academy</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.version}>{APP_VERSION}</Text>
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  script: {
    ...Typography.handwritten,
    color: Colors.textPrimary,
    fontSize: 56,
    lineHeight: 60,
    textAlign: 'center',
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  brand: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 28,
    textAlign: 'center',
  },
  bottom: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  version: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
  },
});
