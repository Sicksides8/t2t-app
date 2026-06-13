import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

export type CoinTxKind = 'chapter' | 'module' | 'streak' | 'spent';

type Props = {
  kind?: CoinTxKind;
  amount: number;
  reason: string;
  caption?: string;
  earned?: boolean;
};

const KIND_CONFIG: Record<
  CoinTxKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  chapter: { icon: 'add-circle-outline', color: Colors.accentHighlight, bg: '#4CC35B26' },
  module: { icon: 'trophy-outline', color: Colors.accentPrimary, bg: '#B73CEF26' },
  streak: { icon: 'flame-outline', color: '#FF7A1A', bg: '#FF7A1A26' },
  spent: { icon: 'remove-circle-outline', color: Colors.warning, bg: '#FFB54726' },
};

function resolveKind(kind: CoinTxKind | undefined, earned: boolean | undefined): CoinTxKind {
  if (kind) return kind;
  if (earned === false) return 'spent';
  return 'chapter';
}

export function ProfileCoinTxRow({ kind, amount, reason, caption, earned }: Props) {
  const k = resolveKind(kind, earned);
  const config = KIND_CONFIG[k];
  const isPositive = k !== 'spent';

  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name={config.icon} size={26} color={config.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{reason}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      <Text style={[styles.amount, isPositive ? styles.amountEarned : styles.amountSpent]}>
        {isPositive ? '+' : '-'}
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(42, 16, 82, 0.45)',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    marginBottom: 10,
  },
  icon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 13,
    color: '#C2AAD6',
    fontWeight: '500',
  },
  amount: {
    fontSize: 18,
    fontWeight: '900',
  },
  amountEarned: {
    color: Colors.accentHighlight,
  },
  amountSpent: {
    color: Colors.warning,
  },
});
