import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme';

type Props = {
  streakDays: number;
};

export function ProfileProgressStreakHero({ streakDays }: Props) {
  return (
    <LinearGradient
      colors={['#FF6B35', Colors.accentPrimary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Ionicons name="flame" size={48} color={Colors.textPrimary} />
      <View style={styles.col}>
        <Text style={styles.days}>{streakDays} días</Text>
        <Text style={styles.label}>de racha · ¡mantenela viva!</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    borderRadius: 24,
    marginBottom: 12,
  },
  col: {
    flex: 1,
    gap: 4,
  },
  days: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    color: Colors.textPrimary,
    lineHeight: 52,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
