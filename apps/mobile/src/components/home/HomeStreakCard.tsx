import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';

type Props = {
  streakDays: number;
};

export function HomeStreakCard({ streakDays }: Props) {
  const label = streakDays === 1 ? '1 día seguido' : `${streakDays} días seguidos`;

  return (
    <View style={styles.wrap}>
      <View style={styles.tape} />
      <View style={styles.card}>
        <Ionicons name="flame" size={30} color="#FF6B35" />
        <View style={styles.textCol}>
          <Text style={styles.count}>{label}</Text>
          <Text style={styles.cheer}>¡seguí así!</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
    transform: [{ rotate: '-2deg' }],
  },
  tape: {
    position: 'absolute',
    top: -4,
    left: -8,
    width: 60,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#4CC35B73',
    transform: [{ rotate: '-5deg' }],
    zIndex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFF7E8',
    shadowColor: '#1D083A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 6,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  count: {
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.bgPrimary,
  },
  cheer: {
    ...Typography.script,
    fontSize: 20,
    fontWeight: '400',
    color: '#1D083ACC',
    lineHeight: 24,
  },
});
