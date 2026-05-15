import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme';
import type { Plan } from '../../types';

type Props = {
  plan: Plan;
};

export function ProfilePlanCard({ plan }: Props) {
  const priceLabel =
    plan.price > 0 ? `${plan.currency} ${plan.price} / mes` : 'Gratis';

  return (
    <LinearGradient
      colors={[Colors.accentPrimary, '#5B1B9E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.badge}>PLAN ACTIVO</Text>
      <Text style={styles.name}>{plan.name.toUpperCase()}</Text>
      <View style={styles.row}>
        <Text style={styles.price}>{priceLabel}</Text>
        <Text style={styles.renew}>Renueva según tu ciclo</Text>
      </View>
      {plan.features.length > 0 ? (
        <Text style={styles.features}>{plan.features.slice(0, 3).join(' · ')}</Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
    marginBottom: 12,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  renew: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  features: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
