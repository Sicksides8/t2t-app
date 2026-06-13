import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme';

type Props = {
  label: string;
  title: string;
  reward: number;
  daysLeft?: number;
  hoursLeft?: number;
};

export function ProfileChallengeHero({ label, title, reward, daysLeft = 3, hoursLeft = 12 }: Props) {
  return (
    <LinearGradient
      colors={['#7A22B5', '#B73CEF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.badge}>{label}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.timer}>
          <Ionicons name="time-outline" size={16} color="#FFFFFF" />
          <Text style={styles.metaText}>
            {daysLeft} días {hoursLeft} hs
          </Text>
        </View>
        <View style={styles.coins}>
          <Ionicons name="trophy-outline" size={14} color={Colors.accentHighlight} />
          <Text style={styles.coinsText}>+{reward} Coins</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#FFFFFFB3',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#4CC35B33',
    borderWidth: 1,
    borderColor: '#4CC35B66',
  },
  metaText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  coinsText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accentHighlight,
  },
});
