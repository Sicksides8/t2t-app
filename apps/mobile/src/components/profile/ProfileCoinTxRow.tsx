import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

type Props = {
  amount: number;
  reason: string;
  earned: boolean;
};

export function ProfileCoinTxRow({ amount, reason, earned }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, earned ? styles.iconEarned : styles.iconSpent]}>
        <Ionicons
          name={earned ? 'add-circle' : 'remove-circle'}
          size={20}
          color={earned ? Colors.accentHighlight : Colors.warning}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.reason}>{reason}</Text>
        <Text style={[styles.amount, earned ? styles.amountEarned : styles.amountSpent]}>
          {earned ? '+' : '-'}
          {amount} coins
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEarned: {
    backgroundColor: '#4CC35B26',
  },
  iconSpent: {
    backgroundColor: '#FFB54726',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  reason: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountEarned: {
    color: Colors.accentHighlight,
  },
  amountSpent: {
    color: Colors.warning,
  },
});
