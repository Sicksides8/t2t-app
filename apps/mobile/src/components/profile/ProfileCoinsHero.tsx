import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { T2TCoin } from '../ui';
import { Colors } from '../../theme';

type Props = {
  balance: number;
};

export function ProfileCoinsHero({ balance }: Props) {
  return (
    <View style={styles.wrap}>
      <T2TCoin size={80} />
      <Text style={styles.balance}>{balance}</Text>
      <Text style={styles.label}>T2T Coins acumuladas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
    paddingBottom: 18,
  },
  balance: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -1,
    color: Colors.accentHighlight,
    lineHeight: 70,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C2AAD6',
  },
});
