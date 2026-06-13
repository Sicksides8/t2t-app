import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../../theme';
import type { HookPlanReadyContent } from '../../data/hooksFlow';

type Props = {
  content: HookPlanReadyContent;
  icon?: 'trophy' | 'gift';
};

export function HookPlanReady({ content, icon = 'trophy' }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow1} />
      <View style={styles.glow2} />
      <LinearGradient
        colors={['#2E9540', '#4CC35B', '#6DE38A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tile}
      >
        <Ionicons name={icon} size={56} color="#0E2A14" />
      </LinearGradient>

      <View style={styles.polaroidWrap}>
        <View style={styles.ribbon} />
        <View style={styles.polaroid}>
          <Text style={styles.script}>{content.scriptLine}</Text>
          <Text style={styles.headline}>{content.headline}</Text>
          {content.caption ? <Text style={styles.caption}>{content.caption}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 28,
  },
  glow1: {
    position: 'absolute',
    top: 0,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#4CC35B33',
  },
  glow2: {
    position: 'absolute',
    top: 20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4CC35B40',
  },
  tile: {
    width: 140,
    height: 140,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CC35B',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  polaroidWrap: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  ribbon: {
    position: 'absolute',
    top: -8,
    width: 120,
    height: 16,
    backgroundColor: '#4CC35B99',
    borderRadius: 4,
    transform: [{ rotate: '-1.5deg' }],
  },
  polaroid: {
    width: '100%',
    backgroundColor: Colors.cream,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    gap: 6,
    transform: [{ rotate: '-1.2deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  script: {
    fontFamily: 'DreamingOutloud',
    color: '#2E9540',
    fontSize: 28,
  },
  headline: {
    color: Colors.textOnCream,
    fontWeight: '800',
    fontSize: 22,
    textAlign: 'center',
  },
  caption: {
    color: '#666666',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
