import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { T2TCoin } from '../ui';
import { Colors, Typography } from '../../theme';

type Props = {
  amount: number;
  message?: string;
};

export function CoinBanner({ amount, message }: Props) {
  return (
    <View style={styles.banner}>
      <T2TCoin size={28} />
      <Text style={styles.text}>
        {message || `Ganás +${amount} T2T Coins al completar el curso`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#4CC35B26',
    borderWidth: 1,
    borderColor: '#4CC35B66',
  },
  text: {
    ...Typography.bodyMedium,
    color: Colors.accentHighlight,
    flex: 1,
    fontWeight: '700',
    fontSize: 14,
  },
});
