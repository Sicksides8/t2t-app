import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  streakDays: number;
  longestStreak?: number;
  freezes?: number;
};

export function ProfileProgressStreakHero({ streakDays, longestStreak = 0, freezes = 0 }: Props) {
  const showRecord = longestStreak > streakDays;

  return (
    <LinearGradient
      colors={['#F953C6', '#FF7A1A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Ionicons name="flame" size={40} color="#FFFFFF" />
      <View style={styles.col}>
        <Text style={styles.days}>{streakDays} días</Text>
        <Text style={styles.label}>
          de racha · {showRecord ? `récord ${longestStreak}` : '¡mantenela viva!'}
        </Text>
      </View>
      {freezes > 0 ? (
        <View style={styles.freezePill}>
          <Ionicons name="snow" size={16} color="#FFFFFF" />
          <Text style={styles.freezeText}>{freezes}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  col: {
    flex: 1,
    gap: 4,
  },
  days: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    color: '#FFFFFF',
    lineHeight: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFFCC',
  },
  freezePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF33',
    borderWidth: 1,
    borderColor: '#FFFFFF55',
  },
  freezeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
});
