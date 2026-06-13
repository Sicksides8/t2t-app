import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';

type Props = {
  streakDays: number;
  /** Si false, el usuario aún no entró hoy: mostramos copy anti-churn. */
  activeToday?: boolean;
  /** Escudos disponibles (1 por semana). */
  freezes?: number;
};

export function HomeStreakCard({ streakDays, activeToday = true, freezes = 0 }: Props) {
  if (streakDays <= 0) {
    return (
      <View style={styles.wrap}>
        <View style={styles.tape} />
        <View style={styles.card}>
          <Ionicons name="flame-outline" size={28} color="#A35A1A" />
          <View style={styles.textCol}>
            <Text style={styles.count}>Empezá tu racha hoy</Text>
            <Text style={styles.cheer}>¡vamos!</Text>
          </View>
        </View>
      </View>
    );
  }

  const label = streakDays === 1 ? '1 día seguido' : `${streakDays} días seguidos`;
  const cheer = activeToday ? '¡seguí así!' : 'Volvé hoy para no perderla';
  const cheerColor = activeToday ? '#2E9540' : '#C24A1A';

  return (
    <View style={styles.wrap}>
      <View style={styles.tape} />
      <View style={styles.card}>
        <Ionicons name="flame" size={26} color="#FF7A1A" />
        <View style={styles.textCol}>
          <Text style={styles.count}>{label}</Text>
          <Text style={[styles.cheer, { color: cheerColor }]}>{cheer}</Text>
        </View>
        {freezes > 0 ? (
          <View style={styles.freezeBadge}>
            <Ionicons name="snow" size={14} color="#1F7AC2" />
            <Text style={styles.freezeText}>{freezes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
    transform: [{ rotate: '-1.2deg' }],
  },
  tape: {
    position: 'absolute',
    top: -6,
    left: 18,
    width: 88,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#4CC35B99',
    transform: [{ rotate: '-4deg' }],
    zIndex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: Colors.cream,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  count: {
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textOnCream,
  },
  cheer: {
    fontFamily: 'DreamingOutloud',
    fontSize: 22,
    lineHeight: 26,
  },
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#D9ECFA',
    borderWidth: 1,
    borderColor: '#9CC9EE',
  },
  freezeText: {
    color: '#1F7AC2',
    fontWeight: '800',
    fontSize: 12,
  },
});
