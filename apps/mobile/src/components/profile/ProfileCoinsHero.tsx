import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

type Props = {
  balance: number;
};

export function ProfileCoinsHero({ balance }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="logo-bitcoin" size={36} color={Colors.accentHighlight} />
      </View>
      <Text style={styles.balance}>{balance}</Text>
      <Text style={styles.label}>T2T Coins acumuladas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    marginBottom: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CC35B26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    color: Colors.accentHighlight,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
