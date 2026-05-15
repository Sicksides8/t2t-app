import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressBar } from '../ui';
import { Colors } from '../../theme';

type Props = {
  label: string;
  title: string;
  progress: number;
  target: number;
  reward: number;
};

export function ProfileChallengeHero({ label, title, progress, target, reward }: Props) {
  const pct = target > 0 ? Math.min(100, (progress / target) * 100) : 0;

  return (
    <LinearGradient
      colors={[Colors.accentPrimary, '#5B1B9E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.badge}>{label}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.timer}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>Esta semana</Text>
        </View>
        <View style={styles.coins}>
          <Ionicons name="logo-bitcoin" size={14} color={Colors.accentHighlight} />
          <Text style={styles.coinsText}>+{reward} coins</Text>
        </View>
      </View>
      <Text style={styles.progressLabel}>
        {Math.min(progress, target)}/{target} lecciones
      </Text>
      <ProgressBar value={pct} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 10,
    marginBottom: 14,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  coinsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accentHighlight,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
