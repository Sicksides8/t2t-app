import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../../theme';

type Props = {
  headline: string;
  subtitle: string;
  badgeName: string;
  badgeReason: string;
};

export function HookBadge({ headline, subtitle, badgeName, badgeReason }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow1} />
      <View style={styles.glow2} />
      <LinearGradient
        colors={['#FFD740', '#FF9800']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.medal}
      >
        <Ionicons name="star" size={72} color="#1A0030" />
      </LinearGradient>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.chip}>
        <Ionicons name="flame" size={16} color={Colors.accentOrange} />
        <Text style={styles.chipText}>{badgeName}</Text>
      </View>
      <Text style={styles.reason}>{badgeReason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 14,
  },
  glow1: {
    position: 'absolute',
    top: 8,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FFA72633',
  },
  glow2: {
    position: 'absolute',
    top: 32,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FF980040',
  },
  medal: {
    width: 160,
    height: 160,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9800',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  headline: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.accentOrange,
    backgroundColor: '#FF980022',
  },
  chipText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.3,
  },
  reason: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
