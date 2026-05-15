import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ProfileField, ProfileGiftHero } from '../profile';
import { Colors, Typography } from '../../theme';

type Props = {
  subtitle: string;
  value: string;
  onChangeText: (v: string) => void;
};

/** Penpot 49 — mismo patrón que RedeemCodeScreen en perfil. */
export function HookPromoCode({ subtitle, value, onChangeText }: Props) {
  return (
    <>
      <ProfileGiftHero />
      <Text style={styles.subtitle}>{subtitle}</Text>
      <ProfileField
        label="Código promocional"
        value={value}
        onChangeText={onChangeText}
        placeholder="T2T-ACADEMY"
      />
    </>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
});
