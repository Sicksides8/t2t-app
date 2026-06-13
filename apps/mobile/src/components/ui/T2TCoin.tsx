import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  size?: number;
};

export function T2TCoin({ size = 24 }: Props) {
  const fontSize = Math.max(7, Math.round(size * 0.34));
  return (
    <View
      style={[
        styles.coin,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: Math.max(1, size * 0.04),
        },
      ]}
    >
      <Text style={[styles.label, { fontSize }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        T2T
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  coin: {
    backgroundColor: Colors.accentCoin,
    borderColor: Colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#7A3E00',
    fontWeight: '900',
    letterSpacing: -0.4,
  },
});
