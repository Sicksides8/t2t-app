import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardGlass } from '../ui';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  amount: number;
  message?: string;
};

export function CoinBanner({ amount, message }: Props) {
  return (
    <CardGlass style={styles.banner}>
      <Ionicons name="logo-bitcoin" size={22} color={Colors.accentSecondary} />
      <Text style={styles.text}>
        {message || `Ganás +${amount} T2T Coins al completar el curso`}
      </Text>
    </CardGlass>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  text: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '700',
  },
});
